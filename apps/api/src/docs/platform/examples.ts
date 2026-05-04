import type { OpenAPIObject } from "@nestjs/swagger";

import {
  applyStandardErrorExample,
  getOperation,
  setJsonRequestExample,
  setJsonSuccessExample
} from "../shared/openapi-helpers";

export function applyPlatformOpenApiExamples(document: OpenAPIObject): void {
  const openApiCustomersOperation = getOperation(document, "/api/open-api/customers", "get");
  const createCredentialOperation = getOperation(document, "/api/open-integration/credentials", "post");
  const createWebhookOperation = getOperation(document, "/api/open-integration/webhooks", "post");
  const webhookDeliveriesOperation = getOperation(document, "/api/open-integration/webhooks/{id}/deliveries", "get");
  const webhookTestOperation = getOperation(document, "/api/open-integration/webhooks/{id}/test", "post");
  const credentialRotateOperation = getOperation(document, "/api/open-integration/credentials/{id}/rotate", "post");

  setJsonSuccessExample(openApiCustomersOperation, "Open API 客户分页结果", {
    items: [
      {
        id: "cust_001",
        name: "上海示例科技有限公司",
        contactName: "王小明",
        phone: "13800000000",
        email: "contact@example.com",
        source: "官网注册",
        status: "ACTIVE",
        owner: {
          id: "user_001",
          displayName: "演示管理员"
        },
        tags: [
          {
            id: "tag_vip",
            name: "VIP"
          }
        ],
        createdAt: "2026-05-01T09:00:00.000Z",
        updatedAt: "2026-05-03T10:30:00.000Z"
      }
    ],
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  setJsonRequestExample(createCredentialOperation, "创建 Open API 凭证请求", {
    name: "ERP 同步凭证",
    scopes: ["customers:read", "customers:write"],
    expiresAt: "2026-12-31T23:59:59.000Z"
  });
  setJsonRequestExample(createWebhookOperation, "创建 Webhook 订阅请求", {
    name: "CRM 客户事件订阅",
    endpointUrl: "https://erp.example.com/webhooks/customer-events",
    eventTypes: ["customer.created", "customer.updated"],
    status: "ENABLED",
    maxAttempts: 5,
    timeoutSeconds: 10
  });

  setJsonSuccessExample(webhookDeliveriesOperation, "Webhook 投递历史", [
    {
      id: "delivery_001",
      eventType: "customer.created",
      sourceType: "customer",
      sourceId: "cust_001",
      status: "SUCCEEDED",
      attemptCount: 1,
      deliveryMode: "REAL",
      durationMs: 132,
      signature: "sha256=abc123",
      responseStatusCode: 200,
      responseBody: "{\"ok\":true}",
      errorMessage: null,
      nextRetryAt: null,
      deliveredAt: "2026-05-04T14:00:00.000Z",
      createdAt: "2026-05-04T14:00:00.000Z"
    }
  ]);
  setJsonSuccessExample(webhookTestOperation, "Webhook 测试投递结果", {
    id: "delivery_test_001",
    eventType: "webhook.test",
    sourceType: "subscription",
    sourceId: "sub_001",
    status: "SUCCEEDED",
    attemptCount: 1,
    deliveryMode: "SIMULATION",
    durationMs: 18,
    signature: "sha256=test123",
    responseStatusCode: 200,
    responseBody: "{\"message\":\"simulated success\"}",
    errorMessage: null,
    nextRetryAt: null,
    deliveredAt: "2026-05-04T14:05:00.000Z",
    createdAt: "2026-05-04T14:05:00.000Z"
  });
  setJsonSuccessExample(credentialRotateOperation, "轮换凭证结果", {
    id: "cred_001",
    name: "ERP 同步凭证",
    accessKey: "ak_live_001",
    scopes: ["customers:read", "customers:write"],
    status: "ACTIVE",
    expiresAt: "2026-12-31T23:59:59.000Z",
    lastUsedAt: "2026-05-03T18:20:00.000Z",
    rotatedAt: "2026-05-04T14:10:00.000Z",
    revokedAt: null,
    createdByName: "演示管理员",
    plainSecret: "sk_live_rotated_001",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-04T14:10:00.000Z"
  });
  applyStandardErrorExample(webhookTestOperation, 403, "/api/open-integration/webhooks/{id}/test", "当前账号没有 Webhook 测试投递权限");
  applyStandardErrorExample(webhookTestOperation, 404, "/api/open-integration/webhooks/{id}/test", "未找到指定 Webhook 订阅");
  applyStandardErrorExample(credentialRotateOperation, 403, "/api/open-integration/credentials/{id}/rotate", "当前账号没有凭证轮换权限");
  applyStandardErrorExample(credentialRotateOperation, 404, "/api/open-integration/credentials/{id}/rotate", "未找到指定 Open API 凭证");
}
