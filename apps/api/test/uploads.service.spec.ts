import { AttachmentBusinessType } from "@prisma/client";
import { Readable } from "stream";

import { MAX_ATTACHMENT_SIZE_BYTES } from "../src/modules/uploads/uploads.constants";
import { UploadsService } from "../src/modules/uploads/uploads.service";

describe("UploadsService", () => {
  const governanceService = {
    assertStoragePreviewAllowed: jest.fn().mockResolvedValue(undefined)
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      governanceService,
      storageDriver
    );
    const actor = {
      id: "manager-1",
      tenantId: "tenant-default",
      tenantCode: "default",
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

    expect(uploadsRepository.findCustomerOwnerById).toHaveBeenCalledWith("customer-1", "tenant-default");
    expect(uploadsRepository.listByBusiness).toHaveBeenCalledWith(
      "tenant-default",
      AttachmentBusinessType.CUSTOMER,
      "customer-1"
    );
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
      governanceService,
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
            size: 1024,
            buffer: Buffer.from("MZ")
          } as Express.Multer.File
        },
        {
          id: "user-1",
          tenantId: "tenant-default",
          tenantCode: "default",
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
      governanceService,
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
            size: MAX_ATTACHMENT_SIZE_BYTES + 1,
            buffer: Buffer.from("%PDF")
          } as Express.Multer.File
        },
        {
          id: "user-1",
          tenantId: "tenant-default",
          tenantCode: "default",
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
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      auditLogsService,
      dataScopeService,
      governanceService,
      storageDriver
    );
    const actor = {
      id: "user-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "sales",
      displayName: "销售",
      roleCodes: ["sales-member"],
      permissions: ["customer:read"]
    };

    const result = await service.download("attachment-1", actor);

    expect(uploadsRepository.findAttachmentById).toHaveBeenCalledWith("attachment-1", "tenant-default");
    expect(dataScopeService.assertOwnerAccessible).toHaveBeenCalledWith(
      actor,
      "owner-1",
      "You do not have access to this attachment."
    );
    expect(storageDriver.openReadStream).toHaveBeenCalledWith("stored-file.pdf");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "DOWNLOAD",
        targetId: "attachment-1"
      })
    );
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
      governanceService,
      storageDriver
    );

    await expect(
      service.download("attachment-1", {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: []
      })
    ).rejects.toThrow("You do not have permission to access this attachment.");

    expect(storageDriver.openReadStream).not.toHaveBeenCalled();
  });

  it("allows secure preview for supported attachment types and records audit log", async () => {
    const stream = Readable.from(["preview"]);
    const uploadsRepository = {
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      findAttachmentById: jest.fn().mockResolvedValue({
        id: "attachment-2",
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        mimeType: "application/pdf",
        originalName: "contract.pdf",
        storageProvider: "LOCAL",
        storageKey: "stored-preview.pdf"
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn().mockResolvedValue({
        stream,
        size: 7
      }),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(uploadsRepository, auditLogsService, dataScopeService, governanceService, storageDriver);

    const result = await service.preview("attachment-2", {
      id: "user-1",
      tenantId: "tenant-default",
      tenantCode: "default",
      username: "sales",
      displayName: "销售",
      roleCodes: ["sales-member"],
      permissions: ["customer:read"]
    });

    expect(storageDriver.openReadStream).toHaveBeenCalledWith("stored-preview.pdf");
    expect(governanceService.assertStoragePreviewAllowed).toHaveBeenCalledWith("LOCAL");
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: "PREVIEW",
        targetId: "attachment-2"
      })
    );
    expect(result).toMatchObject({
      attachment: expect.objectContaining({
        id: "attachment-2"
      }),
      size: 7
    });
  });

  it("rejects preview for unsupported attachment types before opening storage", async () => {
    const uploadsRepository = {
      findAttachmentById: jest.fn().mockResolvedValue({
        id: "attachment-3",
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        originalName: "spec.docx",
        storageProvider: "LOCAL",
        storageKey: "stored-spec.docx"
      }),
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(uploadsRepository, auditLogsService, dataScopeService, governanceService, storageDriver);

    await expect(
      service.preview("attachment-3", {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["customer:read"]
      })
    ).rejects.toThrow("Attachment preview is not supported for this file type.");

    expect(storageDriver.openReadStream).not.toHaveBeenCalled();
    expect(auditLogsService.create).not.toHaveBeenCalled();
  });

  it("rejects preview when storage governance disables preview for the provider", async () => {
    const uploadsRepository = {
      findAttachmentById: jest.fn().mockResolvedValue({
        id: "attachment-4",
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        mimeType: "application/pdf",
        originalName: "contract.pdf",
        storageProvider: "OBJECT_STORAGE",
        storageKey: "object/contract.pdf"
      }),
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const previewBlockedGovernanceService = {
      assertStoragePreviewAllowed: jest.fn().mockRejectedValue(new Error("Attachment preview is disabled for this storage configuration."))
    } as any;
    const storageDriver = {
      store: jest.fn(),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      auditLogsService,
      dataScopeService,
      previewBlockedGovernanceService,
      storageDriver
    );

    await expect(
      service.preview("attachment-4", {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["customer:read"]
      })
    ).rejects.toThrow("Attachment preview is disabled for this storage configuration.");

    expect(previewBlockedGovernanceService.assertStoragePreviewAllowed).toHaveBeenCalledWith("OBJECT_STORAGE");
    expect(storageDriver.openReadStream).not.toHaveBeenCalled();
  });

  it("rejects attachments whose content does not match the declared MIME type", async () => {
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
      governanceService,
      storageDriver
    );

    await expect(
      service.create(
        {
          businessType: AttachmentBusinessType.CUSTOMER,
          businessId: "customer-1",
          file: {
            originalname: "fake.pdf",
            mimetype: "application/pdf",
            size: 1024,
            buffer: Buffer.from("not a pdf")
          } as Express.Multer.File
        },
        {
          id: "user-1",
          tenantId: "tenant-default",
          tenantCode: "default",
          username: "sales",
          displayName: "销售",
          roleCodes: ["sales-member"],
          permissions: ["upload:write", "customer:read"]
        }
      )
    ).rejects.toThrow("Attachment content does not match the declared type.");

    expect(storageDriver.store).not.toHaveBeenCalled();
  });

  it("normalizes uploaded filenames before storage and metadata persistence", async () => {
    const uploadsRepository = {
      findCustomerOwnerById: jest.fn().mockResolvedValue({
        ownerId: "owner-1"
      }),
      createAttachment: jest.fn().mockImplementation(async (input) => ({
        id: "attachment-5",
        ...input,
        createdAt: new Date("2026-04-05T08:00:00.000Z")
      }))
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined)
    } as any;
    const storageDriver = {
      store: jest.fn().mockResolvedValue({
        storageProvider: "LOCAL",
        storageKey: "stored.pdf",
        fileName: "stored.pdf"
      }),
      openReadStream: jest.fn(),
      delete: jest.fn()
    } as any;
    const service = new UploadsService(
      uploadsRepository,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService,
      governanceService,
      storageDriver
    );

    await service.create(
      {
        businessType: AttachmentBusinessType.CUSTOMER,
        businessId: "customer-1",
        file: {
          originalname: "../contract.pdf",
          mimetype: "application/pdf",
          size: 1024,
          buffer: Buffer.from("%PDF-1.7")
        } as Express.Multer.File
      },
      {
        id: "user-1",
        tenantId: "tenant-default",
        tenantCode: "default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["upload:write", "customer:read"]
      }
    );

    expect(storageDriver.store).toHaveBeenCalledWith(expect.objectContaining({ originalname: ".._contract.pdf" }));
    expect(uploadsRepository.createAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: ".._contract.pdf"
      })
    );
  });
});
