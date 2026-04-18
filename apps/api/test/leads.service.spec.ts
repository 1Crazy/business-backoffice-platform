import { ForbiddenException } from "@nestjs/common";

import { LeadsService } from "../src/modules/leads/leads.service";

function buildReminderRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "reminder-1",
    entityType: "LEAD",
    status: "PENDING",
    remindAt: new Date("2026-04-05T10:00:00.000Z"),
    lead: {
      id: "lead-1",
      name: "Acme 潜客",
      contactName: "王强",
      phone: "13800000000"
    },
    customer: null,
    followUp: {
      id: "follow-1",
      content: "明天回访",
      nextFollowUpAt: new Date("2026-04-06T10:00:00.000Z")
    },
    owner: {
      id: "user-1",
      username: "sales",
      displayName: "销售",
      email: null,
      phone: null,
      status: "ACTIVE",
      departmentId: "dept-1"
    },
    createdAt: new Date("2026-04-05T08:00:00.000Z"),
    updatedAt: new Date("2026-04-05T09:00:00.000Z"),
    ...overrides
  } as any;
}

describe("LeadsService", () => {
  it("converts an unconverted lead into a customer", async () => {
    const leadsRepository = {
      findSnapshotById: jest.fn().mockResolvedValue({
        id: "lead-1",
        tenantId: "tenant-default",
        name: "Acme 潜客",
        contactName: "王强",
        phone: "13800000000",
        source: "website",
        notes: "高意向",
        ownerId: "user-1",
        status: "NEW",
        convertedCustomerId: null
      }),
      convertLeadToCustomer: jest.fn().mockResolvedValue({ id: "customer-1" })
    } as any;
    const auditLogsService = {
      create: jest.fn().mockResolvedValue(undefined)
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({})
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: jest.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: jest.fn()
    } as any;
    const notificationCenterService = {
      publishEvent: jest.fn().mockResolvedValue(undefined)
    } as any;

    const service = new LeadsService(
      leadsRepository,
      auditLogsService,
      dataScopeService,
      accessPolicyService,
      notificationCenterService
    );
    jest.spyOn(service, "detail").mockResolvedValue({
      id: "lead-1",
      convertedCustomerId: "customer-1"
    } as any);

    const result = await service.convert("lead-1", {
      id: "user-1",
      tenantId: "tenant-default",
      username: "sales",
      displayName: "销售",
      roleCodes: ["sales-member"],
      permissions: ["lead:convert"]
    });

    expect(leadsRepository.findSnapshotById).toHaveBeenCalledWith("lead-1", "tenant-default");
    expect(leadsRepository.convertLeadToCustomer).toHaveBeenCalled();
    expect(result.convertedCustomerId).toBe("customer-1");
    expect(auditLogsService.create).toHaveBeenCalled();
  });

  it("prevents repeated lead conversion", async () => {
    const leadsRepository = {
      findSnapshotById: jest.fn().mockResolvedValue({
        id: "lead-1",
        tenantId: "tenant-default",
        ownerId: "user-1",
        status: "CONVERTED",
        convertedCustomerId: "customer-1"
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({})
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: jest.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: jest.fn()
    } as any;

    const service = new LeadsService(
      leadsRepository,
      {
        create: jest.fn()
      } as any,
      dataScopeService,
      accessPolicyService,
      {
        publishEvent: jest.fn().mockResolvedValue(undefined)
      } as any
    );

    await expect(
      service.convert("lead-1", {
        id: "user-1",
        tenantId: "tenant-default",
        username: "sales",
        displayName: "销售",
        roleCodes: ["sales-member"],
        permissions: ["lead:convert"]
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns paginated reminders scoped by the shared data scope service", async () => {
    const leadsRepository = {
      listPendingReminders: jest.fn().mockResolvedValue({
        items: [buildReminderRecord()],
        total: 6
      })
    } as any;
    const dataScopeService = {
      assertOwnerAccessible: jest.fn().mockResolvedValue(undefined),
      buildScopedOwnerFilter: jest.fn().mockResolvedValue({
        ownerId: {
          in: ["user-1", "user-2"]
        }
      })
    } as any;
    const accessPolicyService = {
      sanitizeReadFields: jest.fn().mockImplementation((_actor, _resource, payload) => payload),
      assertWritableFields: jest.fn()
    } as any;
    const service = new LeadsService(
      leadsRepository,
      {
        create: jest.fn().mockResolvedValue(undefined)
      } as any,
      dataScopeService,
      accessPolicyService,
      {
        publishEvent: jest.fn().mockResolvedValue(undefined)
      } as any
    );
    const actor = {
      id: "manager-1",
      tenantId: "tenant-default",
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
    expect(leadsRepository.listPendingReminders).toHaveBeenCalledWith(
      "tenant-default",
      {
        ownerId: {
          in: ["user-1", "user-2"]
        },
        status: "PENDING"
      },
      [{ remindAt: "asc" }, { id: "desc" }],
      {
        page: 1,
        pageSize: 2,
        skip: 0,
        take: 2
      }
    );
    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          id: "reminder-1",
          remindAt: "2026-04-05T10:00:00.000Z"
        })
      ],
      page: 1,
      pageSize: 2,
      total: 6,
      totalPages: 3,
      sortBy: "remindAt",
      sortOrder: "asc"
    });
  });
});
