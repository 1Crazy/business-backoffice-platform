/** uploads 模块 repository：负责 uploads 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

export type AttachmentRecord = Prisma.AttachmentGetPayload<Record<string, never>>;

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByBusiness(tenantId: string, businessType: AttachmentRecord["businessType"], businessId: string) {
    return this.prisma.attachment.findMany({
      where: {
        tenantId,
        businessType,
        businessId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  createAttachment(input: {
    tenantId: string;
    businessType: AttachmentRecord["businessType"];
    businessId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    storageProvider: AttachmentRecord["storageProvider"];
    storageKey: string;
    uploadedById: string;
  }) {
    return this.prisma.attachment.create({
      data: {
        tenantId: input.tenantId,
        businessType: input.businessType,
        businessId: input.businessId,
        fileName: input.fileName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        storageProvider: input.storageProvider,
        storageKey: input.storageKey,
        uploadedById: input.uploadedById,
        customerId: input.businessType === "CUSTOMER" ? input.businessId : undefined,
        leadId: input.businessType === "LEAD" ? input.businessId : undefined
      }
    });
  }

  findAttachmentById(id: string, tenantId: string) {
    return this.prisma.attachment.findFirstOrThrow({
      where: {
        id,
        tenantId
      }
    });
  }

  findCustomerOwnerById(customerId: string, tenantId: string) {
    return this.prisma.customer.findFirstOrThrow({
      where: {
        id: customerId,
        tenantId
      },
      select: {
        ownerId: true
      }
    });
  }

  findLeadOwnerById(leadId: string, tenantId: string) {
    return this.prisma.lead.findFirstOrThrow({
      where: {
        id: leadId,
        tenantId
      },
      select: {
        ownerId: true
      }
    });
  }
}
