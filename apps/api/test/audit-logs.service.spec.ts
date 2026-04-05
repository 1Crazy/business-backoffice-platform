import { AuditActionType } from "@prisma/client";

import { AuditLogsService } from "../src/modules/audit-logs/audit-logs.service";

describe("AuditLogsService", () => {
  it("returns paginated audit logs with filters and date range", async () => {
    const items = [
      {
        id: "audit-2",
        actionType: "UPDATE"
      }
    ];
    const prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(13)
      },
      $transaction: jest.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const service = new AuditLogsService(prisma);

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

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        where: {
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
        }
      })
    );
    expect(result).toMatchObject({
      items,
      page: 2,
      pageSize: 5,
      total: 13,
      totalPages: 3,
      sortBy: "createdAt",
      sortOrder: "desc"
    });
  });
});
