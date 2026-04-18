import { OpenIntegrationRepository } from "../src/modules/open-integration/repositories/open-integration.repository";

describe("OpenIntegrationRepository", () => {
  it("updates open api credentials with id and tenant id together", async () => {
    const prisma = {
      openApiCredential: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any;
    const repository = new OpenIntegrationRepository(prisma);

    jest.spyOn(repository, "findOpenApiCredentialById").mockResolvedValue({ id: "credential-1" } as any);

    await repository.updateOpenApiCredential("credential-1", "tenant-1", {
      revokedAt: new Date("2026-04-18T12:00:00.000Z")
    });

    expect(prisma.openApiCredential.updateMany).toHaveBeenCalledWith({
      where: {
        id: "credential-1",
        tenantId: "tenant-1"
      },
      data: {
        revokedAt: new Date("2026-04-18T12:00:00.000Z")
      }
    });
  });

  it("updates webhook subscriptions with id and tenant id together", async () => {
    const prisma = {
      webhookSubscription: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any;
    const repository = new OpenIntegrationRepository(prisma);

    jest.spyOn(repository, "findWebhookSubscriptionById").mockResolvedValue({ id: "webhook-1" } as any);

    await repository.updateWebhookSubscription("webhook-1", "tenant-1", {
      updatedByName: "租户管理员"
    });

    expect(prisma.webhookSubscription.updateMany).toHaveBeenCalledWith({
      where: {
        id: "webhook-1",
        tenantId: "tenant-1"
      },
      data: {
        updatedByName: "租户管理员"
      }
    });
  });

  it("updates identity connectors with id and tenant id together", async () => {
    const prisma = {
      identityConnector: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      }
    } as any;
    const repository = new OpenIntegrationRepository(prisma);

    jest.spyOn(repository, "findIdentityConnectorById").mockResolvedValue({ id: "connector-1" } as any);

    await repository.updateIdentityConnector("connector-1", "tenant-1", {
      updatedByName: "租户管理员",
      config: {
        issuer: "https://idp.acme.test"
      }
    });

    expect(prisma.identityConnector.updateMany).toHaveBeenCalledWith({
      where: {
        id: "connector-1",
        tenantId: "tenant-1"
      },
      data: {
        updatedByName: "租户管理员",
        config: {
          issuer: "https://idp.acme.test"
        }
      }
    });
  });
});
