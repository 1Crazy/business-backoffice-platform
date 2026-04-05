import { ForbiddenException, type INestApplication } from "@nestjs/common";

import { LeadsService } from "../src/modules/leads/leads.service";

describe("LeadsService", () => {
  it("converts an unconverted lead into a customer", async () => {
    const prisma = {
      lead: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "lead-1",
          name: "Acme 潜客",
          contactName: "王强",
          phone: "13800000000",
          source: "website",
          notes: "高意向",
          ownerId: "user-1",
          status: "NEW",
          convertedCustomerId: null
        })
      },
      $transaction: jest.fn().mockImplementation(async (callback) =>
        callback({
          customer: {
            create: jest.fn().mockResolvedValue({ id: "customer-1" })
          },
          lead: {
            update: jest.fn().mockResolvedValue(undefined)
          }
        })
      )
    } as any;

    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({})
    } as any;

    const service = new LeadsService(prisma, auditLogsService, dataScopeService);
    jest.spyOn(service, "detail").mockResolvedValue({
      id: "lead-1",
      convertedCustomerId: "customer-1"
    } as any);

    const result = await service.convert("lead-1", {
      id: "user-1",
      username: "sales",
      displayName: "销售",
      roleCodes: ["sales-member"],
      permissions: ["lead:convert"]
    });

    expect(result.convertedCustomerId).toBe("customer-1");
    expect(auditLogsService.create).toHaveBeenCalled();
  });

  it("prevents repeated lead conversion", async () => {
    const prisma = {
      lead: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "lead-1",
          ownerId: "user-1",
          status: "CONVERTED",
          convertedCustomerId: "customer-1"
        })
      }
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({})
    } as any;

    const service = new LeadsService(
      prisma,
      {
        create: jest.fn()
      } as any,
      dataScopeService
    );

    await expect(
      service.convert("lead-1", {
        id: "user-1",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["lead:convert"]
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns paginated reminders scoped by the shared data scope service", async () => {
    const items = [
      {
        id: "reminder-1",
        remindAt: "2026-04-05T10:00:00.000Z"
      }
    ];
    const prisma = {
      reminder: {
        findMany: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(6)
      },
      $transaction: jest.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({
        ownerId: {
          in: ["user-1", "user-2"]
        }
      })
    } as any;
    const service = new LeadsService(
      prisma,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService
    );
    const actor = {
      id: "manager-1",
      username: "manager",
      displayName: "销售主管",
      roleCodes: ["sales-manager"],
      permissions: ["lead:read"]
    };

    const result = await service.pendingReminders(
      {
        page: 1,
        pageSize: 2,
        sortBy: "remindAt",
        sortOrder: "asc"
      },
      actor
    );

    expect(dataScopeService.buildScopedOwnerFilter).toHaveBeenCalledWith(actor, undefined);
    expect(prisma.reminder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 2,
        orderBy: [{ remindAt: "asc" }, { id: "desc" }],
        where: {
          ownerId: {
            in: ["user-1", "user-2"]
          },
          status: "PENDING"
        }
      })
    );
    expect(result).toMatchObject({
      items,
      page: 1,
      pageSize: 2,
      total: 6,
      totalPages: 3,
      sortBy: "remindAt",
      sortOrder: "asc"
    });
  });
});
