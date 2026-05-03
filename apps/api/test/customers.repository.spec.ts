import { CustomersRepository } from "../src/modules/customers/repositories/customers.repository";

describe("CustomersRepository", () => {
  it("lists customers with pagination and shared include", async () => {
    const prisma = {
      customer: {
        findMany: vi.fn().mockResolvedValue([{ id: "customer-1" }]),
        count: vi.fn().mockResolvedValue(1)
      },
      $transaction: vi.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const repository = new CustomersRepository(prisma);

    const result = await repository.list(
      "tenant-default",
      {
        status: "active"
      },
      [{ createdAt: "desc" }, { id: "desc" }],
      {
        page: 1,
        pageSize: 10,
        skip: 0,
        take: 10
      }
    );

    expect(prisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ tenantId: "tenant-default" }, { status: "active" }]
        },
        skip: 0,
        take: 10
      })
    );
    expect(result).toEqual({
      items: [{ id: "customer-1" }],
      total: 1
    });
  });

  it("creates reminders together with customer follow-ups", async () => {
    const tx = {
      followUp: {
        create: vi.fn().mockResolvedValue({
          id: "follow-1"
        }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "follow-1"
        })
      },
      reminder: {
        create: vi.fn().mockResolvedValue({
          id: "reminder-1"
        })
      }
    };
    const prisma = {
      $transaction: vi.fn().mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    } as any;
    const repository = new CustomersRepository(prisma);

    await repository.createFollowUp({
      customerId: "customer-1",
      ownerId: "owner-1",
      createdById: "user-1",
      content: "继续跟进",
      nextFollowUpAt: "2026-04-06T10:00:00.000Z",
      entityType: "CUSTOMER"
    } as any);

    expect(tx.followUp.create).toHaveBeenCalled();
    expect(tx.reminder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: "customer-1",
          ownerId: "owner-1"
        })
      })
    );
  });
});
