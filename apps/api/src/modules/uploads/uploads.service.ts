import { Injectable } from "@nestjs/common";
import { AttachmentBusinessType, AuditActionType } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ListUploadsDto } from "./dto/list-uploads.dto";

interface UploadInput {
  businessType: AttachmentBusinessType;
  businessId: string;
  file: Express.Multer.File;
}

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(query: ListUploadsDto) {
    return this.prisma.attachment.findMany({
      where: {
        businessType: query.businessType as AttachmentBusinessType | undefined,
        businessId: query.businessId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async create(input: UploadInput, actor: AuthUser) {
    const attachment = await this.prisma.attachment.create({
      data: {
        businessType: input.businessType,
        businessId: input.businessId,
        fileName: input.file.filename,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        size: input.file.size,
        path: input.file.path,
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
  }
}

