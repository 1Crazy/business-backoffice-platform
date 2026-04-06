/** uploads 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException
} from "@nestjs/common";
import { AttachmentBusinessType, AuditActionType } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { mapAttachment } from "@/common/mappers/entity.mapper";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ListUploadsDto } from "./dto/list-uploads.dto";
import { UploadsRepository } from "./repositories/uploads.repository";
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
    private readonly uploadsRepository: UploadsRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScopeService: DataScopeService,
    @Inject(ATTACHMENT_STORAGE_DRIVER)
    private readonly storageDriver: AttachmentStorageDriver
  ) {}

  async list(query: ListUploadsDto, actor: AuthUser) {
    await this.assertBusinessAccessible(query.businessType, query.businessId, actor);

    const attachments = await this.uploadsRepository.listByBusiness(query.businessType, query.businessId);

    return attachments.map((attachment) => mapAttachment(attachment));
  }

  async create(input: UploadInput, actor: AuthUser) {
    this.validateFile(input.file);
    await this.assertBusinessAccessible(input.businessType, input.businessId, actor);
    const storedFile = await this.storageDriver.store(input.file);

    try {
      const attachment = await this.uploadsRepository.createAttachment({
        businessType: input.businessType,
        businessId: input.businessId,
        fileName: storedFile.fileName,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        size: input.file.size,
        storageProvider: storedFile.storageProvider,
        storageKey: storedFile.storageKey,
        uploadedById: actor.id
      });

      await this.auditLogsService.create({
        actorId: actor.id,
        actorName: actor.displayName,
        actionType: AuditActionType.UPLOAD,
        targetType: "attachment",
        targetId: attachment.id
      });

      return mapAttachment(attachment);
    } catch (error) {
      // 先落存储、再写数据库时，任何仓储失败都必须回滚物理文件，避免产生孤儿附件。
      await this.storageDriver.delete(storedFile.storageKey);
      throw error;
    }
  }

  async download(id: string, actor: AuthUser) {
    const attachment = await this.uploadsRepository.findAttachmentById(id);

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
      const customer = await this.uploadsRepository.findCustomerOwnerById(businessId);

      await this.dataScopeService.assertOwnerAccessible(actor, customer.ownerId, "You do not have access to this attachment.");
      return;
    }

    if (businessType === AttachmentBusinessType.LEAD) {
      const lead = await this.uploadsRepository.findLeadOwnerById(businessId);

      await this.dataScopeService.assertOwnerAccessible(actor, lead.ownerId, "You do not have access to this attachment.");
      return;
    }

    throw new BadRequestException("Unsupported attachment business type.");
  }

  private assertBusinessPermission(actor: AuthUser, businessType: AttachmentBusinessType): void {
    // 附件除了数据范围，还要求具备业务读取权限，避免通过下载接口绕过页面上的功能权限控制。
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

    // MIME 校验放在 service 层是为了保证无论从控制器还是未来其他入口上传，都共享同一条安全边界。
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number])) {
      throw new UnsupportedMediaTypeException("Attachment type is not supported.");
    }
  }
}
