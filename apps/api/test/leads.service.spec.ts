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

    const service = new LeadsService(prisma, auditLogsService);
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

    const service = new LeadsService(prisma, {
      create: jest.fn()
    } as any);

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
});

