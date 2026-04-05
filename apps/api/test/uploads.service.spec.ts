import { AttachmentBusinessType } from "@prisma/client";
import { Readable } from "stream";

import { MAX_ATTACHMENT_SIZE_BYTES } from "../src/modules/uploads/uploads.constants";
import { UploadsService } from "../src/modules/uploads/uploads.service";

describe("UploadsService", () => {
  it("checks customer ownership before listing attachments", async () => {
    const uploadsRepository = {
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      listByBusiness: jest.fn().mockResolvedValue([
        {
          id: "attachment-1",
          businessType: AttachmentBusinessType.CUSTOMER,
          businessId: "customer-1",
          fileName: "stored.pdf",
          originalName: "contract.pdf",
          mimeType: "application/pdf",
          size: 1024,
          createdAt: new Date("2026-04-05T08:00:00.000Z")
        }
      ])
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService,
      storageDriver
    );
    const actor = {
      id: "manager-1",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["upload:write", "customer:read"]
    };

    const result = await service.list(
      {
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1"
      },
      actor
    );

    expect(uploadsRepository.findCustomerOwnerById).toHaveBeenCalledWith("customer-1");
    expect(uploadsRepository.listByBusiness).toHaveBeenCalledWith(AttachmentBusinessType.CUSTOMER, "customer-1");
    expect(dataScopeService.assertOwnerAccessible).toHaveBeenCalledWith(
      actor,
      "owner-1",
      "You do not have access to this attachment."
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: "attachment-1",
        createdAt: "2026-04-05T08:00:00.000Z"
      })
    ]);
  });

  it("rejects unsupported attachment types before storage", async () => {
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      {} as any,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      {
        assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
      } as any,
      storageDriver
    );

    await expect(
      service.create(
        {
          businessType: AttachmentBusinessType.CUSTOMER,
          businessId: "customer-1",
          file: {
            originalname: "malware.exe",
            mimetype: "application/x-msdownload",
            size: 1024
          } as Express.Multer.File
        },
        {
          id: "user-1",
          username: "sales",
          displayName: "销售",
          roleCodes: ["sales-member"],
          permissions: ["upload:write", "customer:read"]
        }
      )
    ).rejects.toThrow("Attachment type is not supported.");

    expect(storageDriver.store).not.toHaveBeenCalled();
  });

  it("rejects oversized attachments before storage", async () => {
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      {} as any,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      {
        assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
      } as any,
      storageDriver
    );

    await expect(
      service.create(
        {
          businessType: AttachmentBusinessType.CUSTOMER,
          businessId: "customer-1",
          file: {
            originalname: "too-large.pdf",
            mimetype: "application/pdf",
            size: MAX_ATTACHMENT_SIZE_BYTES + 1
          } as Express.Multer.File
        },
        {
          id: "user-1",
          username: "sales",
          displayName: "销售",
          roleCodes: ["sales-member"],
          permissions: ["upload:write", "customer:read"]
        }
      )
    ).rejects.toThrow("Attachment exceeds the maximum allowed size.");

    expect(storageDriver.store).not.toHaveBeenCalled();
  });

  it("checks business access before downloading attachments", async () => {
    const stream = Readable.from(["hello"]);
    const uploadsRepository = {
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      findAttachmentById: jest.fn().mockResolvedValue({
        id: "attachment-1",
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        mimeType: "application/pdf",
        originalName: "contract.pdf",
        storageKey: "stored-file.pdf"
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn().mockResolvedValue({
        stream,
        size: 5
      }),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService,
      storageDriver
    );
    const actor = {
      id: "user-1",
      username: "sales",
      displayName: "销售",
      roleCodes: ["sales-member"],
      permissions: ["customer:read"]
    };

    const result = await service.download("attachment-1", actor);

    expect(uploadsRepository.findAttachmentById).toHaveBeenCalledWith("attachment-1");
    expect(dataScopeService.assertOwnerAccessible).toHaveBeenCalledWith(
      actor,
      "owner-1",
      "You do not have access to this attachment."
    );
    expect(storageDriver.openReadStream).toHaveBeenCalledWith("stored-file.pdf");
    expect(result).toMatchObject({
      attachment: expect.objectContaining({
        id: "attachment-1"
      }),
      size: 5
    });
  });

  it("rejects attachment download when the actor lacks business read permission", async () => {
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const uploadsRepository = {
      findAttachmentById: jest.fn().mockResolvedValue({
        id: "attachment-1",
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        storageKey: "stored-file.pdf"
      })
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      {
        assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
      } as any,
      storageDriver
    );

    await expect(
      service.download("attachment-1", {
        id: "user-1",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: []
      })
    ).rejects.toThrow("You do not have permission to access this attachment.");

    expect(storageDriver.openReadStream).not.toHaveBeenCalled();
  });
});
