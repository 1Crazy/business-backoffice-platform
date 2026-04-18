import { createHash } from "crypto";

import { ForbiddenException } from "@nestjs/common";
import {
  AuditActionType,
  IdentityConnectorMatchField,
  OpenApiCredentialStatus,
  RecordStatus,
  WebhookDeliveryStatus,
  WebhookSubscriptionStatus
} from "@prisma/client";

import { OpenIntegrationService } from "../src/modules/open-integration/open-integration.service";

function buildActor(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    tenantId: "tenant-1",
    tenantCode: "acme",
    username: "admin",
    displayName: "租户管理员",
    roleCodes: ["tenant-admin"],
    permissions: ["dictionary:read", "dictionary:write"],
    ...overrides
  } as any;
}

function buildConnectorUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-connector",
    tenantId: "tenant-1",
    username: "finance.admin",
    email: "admin@acme.test",
    displayName: "财务管理员",
    status: "ACTIVE",
    tenant: {
      id: "tenant-1",
      code: "acme",
      status: "ACTIVE",
      archivedAt: null
    },
    roles: []
  } as any;
}

describe("OpenIntegrationService", () => {
  const repository = {
    listOpenApiCredentials: jest.fn(),
    findOpenApiCredentialById: jest.fn(),
    findOpenApiCredentialByAccessKey: jest.fn(),
    createOpenApiCredential: jest.fn(),
    updateOpenApiCredential: jest.fn(),
    listWebhookSubscriptions: jest.fn(),
    findWebhookSubscriptionById: jest.fn(),
    createWebhookSubscription: jest.fn(),
    updateWebhookSubscription: jest.fn(),
    createWebhookDelivery: jest.fn(),
    listWebhookDeliveries: jest.fn(),
    listIdentityConnectors: jest.fn(),
    findIdentityConnectorById: jest.fn(),
    createIdentityConnector: jest.fn(),
    updateIdentityConnector: jest.fn(),
    findIdentityBindingBySubject: jest.fn(),
    upsertIdentityBinding: jest.fn(),
    findConnectorLoginUser: jest.fn(),
    listOpenApiCustomers: jest.fn(),
    findOpenApiCustomerById: jest.fn()
  };
  const auditLogsService = {
    create: jest.fn().mockResolvedValue(undefined)
  };
  const authService = {
    loginWithUser: jest.fn()
  };
  const service = new OpenIntegrationService(repository as any, auditLogsService as any, authService as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates tenant-level open api credentials with plaintext secret returned once", async () => {
    repository.createOpenApiCredential.mockImplementation(async (input) => ({
      id: "credential-1",
      tenantId: input.tenantId,
      name: input.name,
      accessKey: input.accessKey,
      secretHash: input.secretHash,
      scopes: input.scopes,
      status: OpenApiCredentialStatus.ACTIVE,
      expiresAt: input.expiresAt ?? null,
      lastUsedAt: null,
      rotatedAt: null,
      revokedAt: null,
      createdByName: input.createdByName,
      createdAt: new Date("2026-04-18T10:00:00.000Z"),
      updatedAt: new Date("2026-04-18T10:00:00.000Z")
    }));

    const result = await service.createOpenApiCredential(
      {
        name: "经营看板只读",
        scopes: ["customer:read", "lead:read"],
        expiresAt: "2026-05-01T00:00:00.000Z"
      } as any,
      buildActor()
    );

    expect(result.accessKey).toMatch(/^oak_/);
    expect(result.plainSecret).toMatch(/^opsk_/);
    expect(repository.createOpenApiCredential).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        scopes: ["customer:read"]
      })
    );
    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: AuditActionType.CREATE,
        targetType: "open-api-credential"
      })
    );
  });

  it("rejects out-of-scope open api access and records audit", async () => {
    repository.findOpenApiCredentialByAccessKey.mockResolvedValue({
      id: "credential-1",
      tenantId: "tenant-1",
      name: "线索只读",
      accessKey: "oak_scope_only",
      secretHash: createHash("sha256").update("secret-123").digest("hex"),
      scopes: ["lead:read"],
      status: OpenApiCredentialStatus.ACTIVE,
      expiresAt: null,
      lastUsedAt: null,
      rotatedAt: null,
      revokedAt: null,
      createdByName: "租户管理员",
      createdAt: new Date("2026-04-18T10:00:00.000Z"),
      updatedAt: new Date("2026-04-18T10:00:00.000Z")
    });

    await expect(
      service.listOpenApiCustomers({ page: 1, pageSize: 20 } as any, "oak_scope_only", "secret-123")
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(auditLogsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actionType: AuditActionType.ACCESS_DENIED
      })
    );
  });

  it("retries webhook delivery and stores delivery history", async () => {
    repository.findWebhookSubscriptionById.mockResolvedValue({
      id: "webhook-1",
      tenantId: "tenant-1",
      name: "经营回调",
      endpointUrl: "https://hooks.example.test/retry-once",
      eventTypes: ["GOVERNANCE_ALERT"],
      status: WebhookSubscriptionStatus.ACTIVE,
      signingSecret: "whs_secret",
      signingSecretHint: "whs_12...abcd",
      maxAttempts: 3,
      timeoutSeconds: 10,
      lastTriggeredAt: null,
      lastDeliveryStatus: null,
      lastFailureMessage: null,
      createdByName: "租户管理员",
      updatedByName: "租户管理员",
      createdAt: new Date("2026-04-18T10:00:00.000Z"),
      updatedAt: new Date("2026-04-18T10:00:00.000Z")
    });
    repository.createWebhookDelivery.mockImplementation(async (input) => ({
      id: "delivery-1",
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
      eventType: input.eventType,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      payload: input.payload,
      signature: input.signature,
      status: input.status,
      attemptCount: input.attemptCount,
      responseStatusCode: input.responseStatusCode,
      responseBody: input.responseBody,
      errorMessage: input.errorMessage,
      nextRetryAt: input.nextRetryAt,
      deliveredAt: input.deliveredAt,
      createdAt: new Date("2026-04-18T10:05:00.000Z"),
      updatedAt: new Date("2026-04-18T10:05:00.000Z")
    }));
    repository.updateWebhookSubscription.mockResolvedValue(undefined);

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.SUCCEEDED);
    expect(result.attemptCount).toBe(2);
    expect(repository.createWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        status: WebhookDeliveryStatus.SUCCEEDED,
        attemptCount: 2
      })
    );
  });

  it("binds enterprise identity login to tenant user and delegates session issuance", async () => {
    repository.findIdentityConnectorById.mockResolvedValue({
      id: "connector-1",
      tenantId: "tenant-1",
      name: "企业 OAuth",
      type: "OAUTH",
      status: RecordStatus.ACTIVE,
      matchField: IdentityConnectorMatchField.EMAIL,
      issuerUrl: "https://idp.example.test",
      authorizeUrl: null,
      tokenUrl: null,
      directoryUrl: null,
      clientId: "client-1",
      clientSecretHash: "hashed",
      clientSecretHint: "clie...1234",
      allowedDomains: ["acme.test"],
      config: null,
      lastAuthenticatedAt: null,
      lastFailureAt: null,
      lastFailureMessage: null,
      createdByName: "租户管理员",
      updatedByName: "租户管理员",
      createdAt: new Date("2026-04-18T10:00:00.000Z"),
      updatedAt: new Date("2026-04-18T10:00:00.000Z")
    });
    repository.findIdentityBindingBySubject.mockResolvedValue(null);
    repository.findConnectorLoginUser.mockResolvedValue(buildConnectorUser());
    repository.upsertIdentityBinding.mockResolvedValue(undefined);
    repository.updateIdentityConnector.mockResolvedValue(undefined);
    authService.loginWithUser.mockResolvedValue({
      accessToken: "token",
      refreshToken: "refresh",
      sessionExpiresAt: "2026-05-01T00:00:00.000Z",
      user: {
        id: "user-connector"
      }
    });

    const result = await service.loginWithIdentityConnector("connector-1", {
      subject: "idp-user-1",
      email: "admin@acme.test"
    } as any);

    expect(repository.upsertIdentityBinding).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        connectorId: "connector-1",
        userId: "user-connector",
        externalSubject: "idp-user-1"
      })
    );
    expect(authService.loginWithUser).toHaveBeenCalled();
    expect(result.accessToken).toBe("token");
  });
});
