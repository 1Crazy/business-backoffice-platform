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
import { TenantQuotaExceededException, TenantQuotaService } from "@/common/tenant/tenant-quota.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { SystemGovernanceService } from "../system-governance/system-governance.service";
import { ListUploadsDto } from "./dto/list-uploads.dto";
import { UploadsRepository } from "./repositories/uploads.repository";
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  PREVIEWABLE_ATTACHMENT_MIME_TYPES
} from "./uploads.constants";
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
    private readonly systemGovernanceService: SystemGovernanceService,
    private readonly tenantQuotaService: TenantQuotaService,
    @Inject(ATTACHMENT_STORAGE_DRIVER)
    private readonly storageDriver: AttachmentStorageDriver
  ) {}

  async list(query: ListUploadsDto, actor: AuthUser) {
    await this.assertBusinessAccessible(query.businessType, query.businessId, actor);

    const attachments = await this.uploadsRepository.listByBusiness(
      requireTenantId(actor),
      query.businessType,
      query.businessId
    );

    return attachments.map((attachment) => mapAttachment(attachment));
  }

  async create(input: UploadInput, actor: AuthUser) {
    this.validateFile(input.file);
    await this.assertBusinessAccessible(input.businessType, input.businessId, actor);
    const tenantId = requireTenantId(actor);
    await this.assertStorageQuotaAvailable(tenantId, input.file.size, actor, input.businessType, input.businessId);
    const normalizedFile = {
      ...input.file,
      originalname: this.normalizeOriginalName(input.file.originalname)
    };
    const storedFile = await this.storageDriver.store(normalizedFile);

    try {
      const attachment = await this.uploadsRepository.createAttachment({
        tenantId,
        businessType: input.businessType,
        businessId: input.businessId,
        fileName: storedFile.fileName,
        originalName: normalizedFile.originalname,
        mimeType: normalizedFile.mimetype,
        size: normalizedFile.size,
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

  private async assertStorageQuotaAvailable(
    tenantId: string,
    incomingBytes: number,
    actor: AuthUser,
    businessType: AttachmentBusinessType,
    businessId: string
  ): Promise<void> {
    try {
      await this.tenantQuotaService.assertStorageQuotaAvailable(tenantId, incomingBytes);
    } catch (error) {
      if (error instanceof TenantQuotaExceededException) {
        await this.auditLogsService.create({
          actorId: actor.id,
          actorName: actor.displayName,
          actionType: AuditActionType.ACCESS_DENIED,
          targetType: "tenant-quota",
          targetId: tenantId,
          detail: {
            attemptedOperation: "attachment.upload",
            quotaType: error.quota.type,
            limit: error.quota.limit,
            used: error.quota.used,
            requested: error.quota.requested,
            businessType,
            businessId,
            reason: error.quota.message
          }
        });
      }

      throw error;
    }
  }

  async download(id: string, actor: AuthUser) {
    const attachment = await this.uploadsRepository.findAttachmentById(id, requireTenantId(actor));

    await this.assertBusinessAccessible(attachment.businessType, attachment.businessId, actor);
    const file = await this.storageDriver.openReadStream(attachment.storageKey);
    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.DOWNLOAD,
      targetType: "attachment",
      targetId: attachment.id,
      detail: {
        businessType: attachment.businessType,
        businessId: attachment.businessId,
        storageProvider: attachment.storageProvider,
        mimeType: attachment.mimeType
      }
    });

    return {
      attachment,
      ...file
    };
  }

  async preview(id: string, actor: AuthUser) {
    const attachment = await this.uploadsRepository.findAttachmentById(id, requireTenantId(actor));

    await this.assertBusinessAccessible(attachment.businessType, attachment.businessId, actor);
    this.assertPreviewSupported(attachment.mimeType);
    await this.systemGovernanceService.assertStoragePreviewAllowed(attachment.storageProvider);
    const file = await this.storageDriver.openReadStream(attachment.storageKey);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.PREVIEW,
      targetType: "attachment",
      targetId: attachment.id,
      detail: {
        businessType: attachment.businessType,
        businessId: attachment.businessId,
        storageProvider: attachment.storageProvider,
        mimeType: attachment.mimeType
      }
    });

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
      const customer = await this.uploadsRepository.findCustomerOwnerById(businessId, requireTenantId(actor));

      await this.dataScopeService.assertOwnerAccessible(actor, customer.ownerId, "You do not have access to this attachment.");
      return;
    }

    if (businessType === AttachmentBusinessType.LEAD) {
      const lead = await this.uploadsRepository.findLeadOwnerById(businessId, requireTenantId(actor));

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

    if (!file.buffer || !this.isContentConsistentWithMime(file.buffer, file.mimetype)) {
      throw new UnsupportedMediaTypeException("Attachment content does not match the declared type.");
    }
  }

  private assertPreviewSupported(mimeType: string): void {
    if (
      !PREVIEWABLE_ATTACHMENT_MIME_TYPES.includes(
        mimeType as (typeof PREVIEWABLE_ATTACHMENT_MIME_TYPES)[number]
      )
    ) {
      throw new BadRequestException("Attachment preview is not supported for this file type.");
    }
  }

  private normalizeOriginalName(originalName: string): string {
    const fallbackName = "attachment";
    const normalized = originalName
      .replace(/[\\/]/g, "_")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim();

    return normalized || fallbackName;
  }

  private isContentConsistentWithMime(buffer: Buffer, mimeType: string): boolean {
    if (mimeType === "application/pdf") {
      return buffer.subarray(0, 4).toString("ascii") === "%PDF";
    }

    if (mimeType === "image/jpeg") {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (mimeType === "image/png") {
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    if (mimeType === "application/msword" || mimeType === "application/vnd.ms-excel") {
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    }

    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    }

    if (mimeType === "text/plain" || mimeType === "text/csv") {
      return !buffer.includes(0);
    }

    return false;
  }
}
