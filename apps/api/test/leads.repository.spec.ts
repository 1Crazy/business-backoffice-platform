import { LeadsRepository } from "../src/modules/leads/repositories/leads.repository";

describe("LeadsRepository", () => {
  it("lists reminders with pagination and relations", async () => {
    const prisma = {
      reminder: {
        findMany: jest.fn().mockResolvedValue([{ id: "reminder-1" }]),
        count: jest.fn().mockResolvedValue(2)
      },
      $transaction: jest.fn().mockImplementation(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    } as any;
    const repository = new LeadsRepository(prisma);

    const result = await repository.listPendingReminders(
      "tenant-default",
      {
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

    expect(prisma.reminder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ tenantId: "tenant-default" }, { status: "PENDING" }]
        },
        skip: 0,
        take: 2
      })
    );
    expect(result).toEqual({
      items: [{ id: "reminder-1" }],
      total: 2
    });
  });

  it("converts a lead to a customer inside one transaction", async () => {
    const tx = {
      customer: {
        create: jest.fn().mockResolvedValue({
          id: "customer-1"
        })
      },
      lead: {
        update: jest.fn().mockResolvedValue(undefined)
      }
    };
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    } as any;
    const repository = new LeadsRepository(prisma);

    const result = await repository.convertLeadToCustomer({
      id: "lead-1",
      name: "Acme 潜客",
      contactName: "王强",
      phone: "13800000000",
      source: "website",
      status: "NEW",
      notes: "高意向",
      ownerId: "user-1",
      convertedCustomerId: null
    } as any);

    expect(tx.customer.create).toHaveBeenCalled();
    expect(tx.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lead-1" },
        data: expect.objectContaining({
          convertedCustomerId: "customer-1"
        })
      })
    );
    expect(result).toEqual({ id: "customer-1" });
  });
});
