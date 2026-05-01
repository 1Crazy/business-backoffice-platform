import { createHash } from "crypto";

import { BadRequestException, ForbiddenException } from "@nestjs/common";
import {
  AuditActionType,
  IdentityConnectorMatchField,
  OpenApiCredentialStatus,
  RecordStatus,
  WebhookDeliveryStatus,
  WebhookSubscriptionStatus
} from "@prisma/client";

import { OpenIntegrationService } from "../src/modules/open-integration/open-integration.service";
import { RiskThrottleService } from "../src/common/security/risk-throttle.service";

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
  const configService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "SIMULATION"
      };
      return values[key];
    })
  };
  const service = new OpenIntegrationService(
    repository as any,
    auditLogsService as any,
    authService as any,
    configService as any,
    new RiskThrottleService()
  );

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "SIMULATION"
      };
      return values[key];
    });
    jest.restoreAllMocks();
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

  function mockWebhookSubscription(overrides: Record<string, unknown> = {}) {
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
      updatedAt: new Date("2026-04-18T10:00:00.000Z"),
      ...overrides
    });
  }

  function mockWebhookDeliveryCreate() {
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
  }

  it("marks simulated webhook delivery results explicitly", async () => {
    mockWebhookSubscription();
    mockWebhookDeliveryCreate();

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.SUCCEEDED);
    expect(result.attemptCount).toBe(2);
    expect(result.deliveryMode).toBe("SIMULATION");
    expect(result.responseBody).toBe("simulation:accepted");
    expect(repository.createWebhookDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        status: WebhookDeliveryStatus.SUCCEEDED,
        attemptCount: 2,
        responseBody: "simulation:accepted",
        payload: expect.objectContaining({
          deliveryMode: "SIMULATION",
          durationMs: 0
        })
      })
    );
  });

  it("sends real webhook tests and stores response details", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL"
      };
      return values[key];
    });
    mockWebhookSubscription({
      endpointUrl: "https://hooks.example.com/webhook"
    });
    mockWebhookDeliveryCreate();
    jest.spyOn(service as any, "assertWebhookEndpointAllowed").mockResolvedValue(new URL("https://hooks.example.com/webhook"));
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("accepted", {
        status: 202
      })
    );

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.SUCCEEDED);
    expect(result.deliveryMode).toBe("REAL");
    expect(result.responseStatusCode).toBe(202);
    expect(result.responseBody).toBe("accepted");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        method: "POST",
        redirect: "manual",
        headers: expect.objectContaining({
          "x-platform-delivery-mode": "real"
        })
      })
    );
  });

  it("stores failed real webhook status and clipped response details", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL"
      };
      return values[key];
    });
    mockWebhookSubscription({
      endpointUrl: "https://hooks.example.com/fail",
      maxAttempts: 2
    });
    mockWebhookDeliveryCreate();
    jest.spyOn(service as any, "assertWebhookEndpointAllowed").mockResolvedValue(new URL("https://hooks.example.com/fail"));
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("server unavailable", {
        status: 503
      })
    );

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(result.deliveryMode).toBe("REAL");
    expect(result.attemptCount).toBe(2);
    expect(result.responseStatusCode).toBe(503);
    expect(result.errorMessage).toBe("真实投递返回 HTTP 503。");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("rejects invalid webhook URLs before real delivery", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL"
      };
      return values[key];
    });
    mockWebhookSubscription({
      endpointUrl: "ftp://hooks.example.com/webhook"
    });
    mockWebhookDeliveryCreate();

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(result.deliveryMode).toBe("REAL");
    expect(result.errorMessage).toBe("回调地址只允许 http:// 或 https:// 协议。");
  });

  it("blocks private network webhook targets in real mode", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL"
      };
      return values[key];
    });
    mockWebhookSubscription({
      endpointUrl: "http://127.0.0.1:8080/webhook"
    });
    mockWebhookDeliveryCreate();

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(result.deliveryMode).toBe("REAL");
    expect(result.errorMessage).toBe("真实 Webhook 测试不允许投递到内网或本机地址。");
  });

  it("rejects webhook targets outside configured domain allowlist", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL",
        WEBHOOK_ALLOWED_DOMAINS: "hooks.allowed.test,*.trusted.test"
      };
      return values[key];
    });
    mockWebhookSubscription({
      endpointUrl: "https://evil.example.test/webhook"
    });
    mockWebhookDeliveryCreate();

    const result = await service.triggerWebhookTest("webhook-1", buildActor());

    expect(result.status).toBe(WebhookDeliveryStatus.FAILED);
    expect(result.deliveryMode).toBe("REAL");
    expect(result.errorMessage).toBe("Webhook 目标域名不在允许名单内。");
  });

  it("allows webhook targets matching configured wildcard domain allowlist", async () => {
    configService.get.mockImplementation((key: string) => {
      const values: Record<string, string> = {
        NODE_ENV: "test",
        ALLOW_MOCK_CONNECTOR_LOGIN: "true",
        WEBHOOK_TEST_MODE: "REAL",
        WEBHOOK_ALLOWED_DOMAINS: "*.trusted.test"
      };
      return values[key];
    });

    expect(() => (service as any).assertWebhookDomainAllowed("tenant.trusted.test")).not.toThrow();
  });

  it("rejects private IP addresses with the SSRF guard", () => {
    expect(() => (service as any).assertPublicIpAddress("10.0.0.1")).toThrow(BadRequestException);
    expect(() => (service as any).assertPublicIpAddress("192.168.1.10")).toThrow(BadRequestException);
    expect(() => (service as any).assertPublicIpAddress("8.8.8.8")).not.toThrow();
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
      clientSecretHash: createHash("sha256").update("client-secret").digest("hex"),
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
      email: "admin@acme.test",
      proofType: "CLIENT_SECRET",
      proofSecret: "client-secret"
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

  it("rejects connector login without verifiable proof", async () => {
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
      clientSecretHash: createHash("sha256").update("client-secret").digest("hex"),
      clientSecretHint: "clie...cret",
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
    repository.updateIdentityConnector.mockResolvedValue(undefined);

    await expect(
      service.loginWithIdentityConnector("connector-1", {
        subject: "idp-user-1",
        email: "admin@acme.test"
      } as any)
    ).rejects.toThrow("Connector login proof is required.");

    expect(authService.loginWithUser).not.toHaveBeenCalled();
  });

  it("throttles repeated invalid open api secrets", async () => {
    repository.findOpenApiCredentialByAccessKey.mockResolvedValue({
      id: "credential-1",
      tenantId: "tenant-1",
      name: "客户只读",
      accessKey: "oak_limited",
      secretHash: createHash("sha256").update("right-secret").digest("hex"),
      scopes: ["customer:read"],
      status: OpenApiCredentialStatus.ACTIVE,
      expiresAt: null,
      lastUsedAt: null,
      rotatedAt: null,
      revokedAt: null,
      createdByName: "租户管理员",
      createdAt: new Date("2026-04-18T10:00:00.000Z"),
      updatedAt: new Date("2026-04-18T10:00:00.000Z")
    });

    for (let index = 0; index < 10; index += 1) {
      await expect(
        service.listOpenApiCustomers({ page: 1, pageSize: 20 } as any, "oak_limited", "wrong-secret")
      ).rejects.toThrow("Open API credential is invalid.");
    }

    await expect(
      service.listOpenApiCustomers({ page: 1, pageSize: 20 } as any, "oak_limited", "wrong-secret")
    ).rejects.toThrow("Too many failed attempts");
  });
});
