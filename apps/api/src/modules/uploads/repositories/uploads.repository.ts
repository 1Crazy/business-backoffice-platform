import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../common/prisma/prisma.service";

export type AttachmentRecord = Prisma.AttachmentGetPayload<Record<string, never>>;

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByBusiness(businessType: AttachmentRecord["businessType"], businessId: string) {
    return this.prisma.attachment.findMany({
      where: {
        businessType,
        businessId
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  createAttachment(input: {
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

  findAttachmentById(id: string) {
    return this.prisma.attachment.findUniqueOrThrow({
      where: { id }
    });
  }

  findCustomerOwnerById(customerId: string) {
    return this.prisma.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: {
        ownerId: true
      }
    });
  }

  findLeadOwnerById(leadId: string) {
    return this.prisma.lead.findUniqueOrThrow({
      where: { id: leadId },
      select: {
        ownerId: true
      }
    });
  }
}
