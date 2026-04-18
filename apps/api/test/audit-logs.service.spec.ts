import { AuditActionType } from "@prisma/client";

import { AuditLogsService } from "../src/modules/audit-logs/audit-logs.service";

describe("AuditLogsService", () => {
  it("returns paginated audit logs with filters and date range", async () => {
    const auditLogsRepository = {
      list: jest.fn().mockResolvedValue({
        items: [
          {
            id: "audit-2",
            actorId: "user-1",
            actorName: "张三",
            actionType: "UPDATE",
            targetType: "customer",
            targetId: "customer-1",
            detail: {
              field: "ownerId"
            },
            createdAt: new Date("2026-04-05T08:00:00.000Z")
          }
        ],
        total: 13
      })
    } as any;
    const service = new AuditLogsService(auditLogsRepository);

    const result = await service.list({
      actionType: AuditActionType.UPDATE,
      targetType: "customer",
      actorName: "张",
      startDate: "2026-04-01T00:00:00.000Z",
      endDate: "2026-04-05T23:59:59.000Z",
      page: 2,
      pageSize: 5,
      sortBy: "createdAt",
      sortOrder: "desc"
    });

    expect(auditLogsRepository.list).toHaveBeenCalledWith(
      undefined,
      {
        actionType: AuditActionType.UPDATE,
        targetType: "customer",
        targetId: undefined,
        actorId: undefined,
        actorName: {
          contains: "张",
          mode: "insensitive"
        },
        createdAt: {
          gte: new Date("2026-04-01T00:00:00.000Z"),
          lte: new Date("2026-04-05T23:59:59.000Z")
        }
      },
      [{ createdAt: "desc" }, { id: "desc" }],
      {
        page: 2,
        pageSize: 5,
        skip: 5,
        take: 5
      }
    );
    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          id: "audit-2",
          createdAt: "2026-04-05T08:00:00.000Z"
        })
      ],
      page: 2,
      pageSize: 5,
      total: 13,
      totalPages: 3,
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  });
});
