import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException
} from "@nestjs/common";
import { AttachmentBusinessType, AuditActionType } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { DataScopeService } from "../../common/data-scope/data-scope.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ListUploadsDto } from "./dto/list-uploads.dto";
import { ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "./uploads.constants";
import {
  ATTACHMENT_STORAGE_DRIVER,
  type AttachmentStorageDriver
} from "./storage/attachment-storage.driver";

interface UploadInput {
  businessType: AttachmentBusinessType;
  businessId: string;
  file: Express.Multer.File;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService,
    @Inject(ATTACHMENT_STORAGE_DRIVER)
    private readonly storageDriver: AttachmentStorageDriver
  ) {}

  async list(query: ListUploadsDto, actor: AuthUser) {
    await this.assertBusinessAccessible(query.businessType, query.businessId, actor);

    return this.prisma.attachment.findMany({
      where: {
        businessType: query.businessType,
        businessId: query.businessId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async create(input: UploadInput, actor: AuthUser) {
    this.validateFile(input.file);
    await this.assertBusinessAccessible(input.businessType, input.businessId, actor);
    const storedFile = await this.storageDriver.store(input.file);

    try {
      const attachment = await this.prisma.attachment.create({
        data: {
          businessType: input.businessType,
          businessId: input.businessId,
          fileName: storedFile.fileName,
          originalName: input.file.originalname,
          mimeType: input.file.mimetype,
          size: input.file.size,
          storageProvider: storedFile.storageProvider,
          storageKey: storedFile.storageKey,
          uploadedById: actor.id,
          customerId: input.businessType === AttachmentBusinessType.CUSTOMER ? input.businessId : undefined,
          leadId: input.businessType === AttachmentBusinessType.LEAD ? input.businessId : undefined
        }
      });

      await this.auditLogsService.create({
        actorId: actor.id,
        actorName: actor.displayName,
        actionType: AuditActionType.UPLOAD,
        targetType: "attachment",
        targetId: attachment.id
      });

      return attachment;
    } catch (error) {
      await this.storageDriver.delete(storedFile.storageKey);
      throw error;
    }
  }

  async download(id: string, actor: AuthUser) {
    const attachment = await this.prisma.attachment.findUniqueOrThrow({
      where: { id }
    });

    await this.assertBusinessAccessible(attachment.businessType, attachment.businessId, actor);

    const file = await this.storageDriver.openReadStream(attachment.storageKey);

    return {
      attachment,
      ...file
    };
  }

  private async assertBusinessAccessible(
    businessType: AttachmentBusinessType,
    businessId: string,
    actor: AuthUser
  ): Promise<void> {
    this.assertBusinessPermission(actor, businessType);

    if (businessType === AttachmentBusinessType.CUSTOMER) {
      const customer = await this.prisma.customer.findUniqueOrThrow({
        where: { id: businessId },
        select: { ownerId: true }
      });

      await this.dataScopeService.assertOwnerAccessible(actor, customer.ownerId, "You do not have access to this attachment.");
      return;
    }

    if (businessType === AttachmentBusinessType.LEAD) {
      const lead = await this.prisma.lead.findUniqueOrThrow({
        where: { id: businessId },
        select: { ownerId: true }
      });

      await this.dataScopeService.assertOwnerAccessible(actor, lead.ownerId, "You do not have access to this attachment.");
      return;
    }

    throw new BadRequestException("Unsupported attachment business type.");
  }

  private assertBusinessPermission(actor: AuthUser, businessType: AttachmentBusinessType): void {
    const requiredPermission =
      businessType === AttachmentBusinessType.CUSTOMER
        ? "customer:read"
        : businessType === AttachmentBusinessType.LEAD
          ? "lead:read"
          : undefined;

    if (!requiredPermission || !actor.permissions.includes(requiredPermission)) {
      throw new ForbiddenException("You do not have permission to access this attachment.");
    }
  }

  private validateFile(file?: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("Attachment file is required.");
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new PayloadTooLargeException("Attachment exceeds the maximum allowed size.");
    }

    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number])) {
      throw new UnsupportedMediaTypeException("Attachment type is not supported.");
    }
  }
}
