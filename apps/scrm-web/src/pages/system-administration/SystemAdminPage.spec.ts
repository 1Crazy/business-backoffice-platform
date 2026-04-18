import { flushPromises, shallowMount } from "@vue/test-utils";

import SystemAdminPage from "@/pages/system-administration/SystemAdminPage.vue";

const { getMock, postMock, patchMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

function buildOpenApiCredential() {
  return {
    id: "credential-1",
    name: "经营看板只读",
    accessKey: "oak_demo_access_key",
    scopes: ["customer:read"],
    status: "ACTIVE",
    expiresAt: null,
    lastUsedAt: null,
    rotatedAt: null,
    revokedAt: null,
    createdByName: "租户管理员",
    plainSecret: null,
    createdAt: "2026-04-18T10:00:00.000Z",
    updatedAt: "2026-04-18T10:00:00.000Z"
  };
}

function buildWebhookSubscription() {
  return {
    id: "webhook-1",
    name: "经营数据回调",
    endpointUrl: "https://hooks.example.test/retry-once",
    eventTypes: ["GOVERNANCE_ALERT"],
    status: "ACTIVE",
    signingSecretHint: "whs_12...abcd",
    maxAttempts: 3,
    timeoutSeconds: 10,
    lastTriggeredAt: "2026-04-18T10:00:00.000Z",
    lastDeliveryStatus: "SUCCEEDED",
    lastFailureMessage: null,
    createdByName: "租户管理员",
    updatedByName: "租户管理员",
    plainSigningSecret: null,
    createdAt: "2026-04-18T10:00:00.000Z",
    updatedAt: "2026-04-18T10:00:00.000Z"
  };
}

function buildIdentityConnector() {
  return {
    id: "connector-1",
    name: "企业 OAuth",
    type: "OAUTH",
    status: "ACTIVE",
    matchField: "EMAIL",
    issuerUrl: "https://idp.example.test",
    authorizeUrl: null,
    tokenUrl: null,
    directoryUrl: null,
    clientId: "client-1",
    clientSecretHint: "clie...1234",
    allowedDomains: ["acme.test"],
    config: null,
    lastAuthenticatedAt: null,
    lastFailureAt: null,
    lastFailureMessage: null,
    createdByName: "租户管理员",
    updatedByName: "租户管理员",
    createdAt: "2026-04-18T10:00:00.000Z",
    updatedAt: "2026-04-18T10:00:00.000Z"
  };
}

describe("SystemAdminPage", () => {
  function mockSystemAdminRequests() {
    getMock.mockImplementation((url: string, config?: { params?: Record<string, unknown> }) => {
      if (url === "/dictionaries") {
        return Promise.resolve({ data: [] });
      }
      if (url === "/audit-logs") {
        return Promise.resolve({
          data: {
            items: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            sortBy: "createdAt",
            sortOrder: "desc"
          }
        });
      }
      if (url === "/system-governance/notification-channels") {
        return Promise.resolve({
          data: [
            {
              id: "channel-email",
              channel: "EMAIL",
              adapterCode: "smtp-default",
              provider: "smtp",
              displayName: "邮件通知",
              isEnabled: true,
              status: "WARNING",
              routeScope: "审批结果 / 催办升级",
              fallbackChannel: "站内消息",
              recentFailures: 2,
              updatedAt: "2026-04-12T08:45:00.000Z"
            }
          ]
        });
      }
      if (url === "/system-governance/storage-configs") {
        return Promise.resolve({
          data: [
            {
              id: "storage-object-primary",
              code: "object-storage-primary",
              displayName: "主对象存储",
              provider: "OSS",
              isEnabled: true,
              status: "WARNING",
              bucketName: "merchant-docs-prod",
              regionLabel: "华东 1",
              previewEnabled: true,
              updatedAt: "2026-04-12T07:50:00.000Z"
            }
          ]
        });
      }
      if (url === "/system-governance/scheduler-jobs") {
        return Promise.resolve({
          data: [
            {
              id: "job-nightly-export-archive",
              code: "nightly-export-archive",
              displayName: "导出归档清理",
              cronExpression: "30 2 * * *",
              status: "PAUSED",
              ownerName: "平台治理",
              lastRunAt: "2026-04-11T02:30:00.000Z",
              nextRunAt: null,
              lastExecutionStatus: "SUCCEEDED",
              lastErrorMessage: null
            }
          ]
        });
      }
      if (url === "/open-integration/credentials") {
        return Promise.resolve({ data: [buildOpenApiCredential()] });
      }
      if (url === "/open-integration/webhooks") {
        return Promise.resolve({ data: [buildWebhookSubscription()] });
      }
      if (url === "/open-integration/webhooks/webhook-1/deliveries") {
        return Promise.resolve({
          data: [
            {
              id: "delivery-1",
              eventType: "GOVERNANCE_ALERT",
              sourceType: "system-administration",
              sourceId: "webhook-1",
              status: "SUCCEEDED",
              attemptCount: 2,
              signature: "sha256=abc",
              responseStatusCode: 200,
              responseBody: "accepted",
              errorMessage: null,
              nextRetryAt: null,
              deliveredAt: "2026-04-18T10:02:00.000Z",
              createdAt: "2026-04-18T10:02:00.000Z"
            }
          ]
        });
      }
      if (url === "/open-integration/connectors") {
        return Promise.resolve({ data: [buildIdentityConnector()] });
      }
      if (url === "/batch-tasks") {
        const status = config?.params?.status;

        if (status === "FAILED") {
          return Promise.resolve({
            data: [
              {
                id: "task-import-payment-003",
                category: "IMPORT",
                resourceType: "CUSTOMER",
                label: "回款导入",
                status: "FAILED",
                progress: 100,
                totalCount: 12,
                successCount: 0,
                failureCount: 12,
                summary: null,
                failureSummary: "12 条记录金额格式不合法",
                inputFileName: "payments.csv",
                resultFileName: null,
                failureFileName: "payments-failures.csv",
                operator: {
                  displayName: "李菲"
                },
                startedAt: "2026-04-12T08:00:00.000Z",
                finishedAt: "2026-04-12T08:12:00.000Z",
                updatedAt: "2026-04-12T08:12:00.000Z"
              }
            ]
          });
        }

        return Promise.resolve({
          data: [
            {
              id: "task-import-customer-001",
              category: "IMPORT",
              resourceType: "CUSTOMER",
              label: "客户导入",
              status: "RUNNING",
              progress: 64,
              totalCount: 120,
              successCount: 76,
              failureCount: 0,
              summary: "正在导入客户。",
              failureSummary: null,
              inputFileName: "customers.csv",
              resultFileName: null,
              failureFileName: null,
              operator: {
                displayName: "王婷婷"
              },
              startedAt: "2026-04-12T10:00:00.000Z",
              finishedAt: null,
              updatedAt: "2026-04-12T10:24:00.000Z"
            },
            {
              id: "task-export-opportunity-002",
              category: "EXPORT",
              resourceType: "CUSTOMER",
              label: "商机导出",
              status: "SUCCEEDED",
              progress: 100,
              totalCount: 20,
              successCount: 20,
              failureCount: 0,
              summary: "导出完成。",
              failureSummary: null,
              inputFileName: null,
              resultFileName: "opportunities.csv",
              failureFileName: null,
              operator: {
                displayName: "陈晨"
              },
              startedAt: "2026-04-12T09:00:00.000Z",
              finishedAt: "2026-04-12T09:18:00.000Z",
              updatedAt: "2026-04-12T09:18:00.000Z"
            },
            {
              id: "task-import-payment-003",
              category: "IMPORT",
              resourceType: "CUSTOMER",
              label: "回款导入",
              status: "FAILED",
              progress: 100,
              totalCount: 12,
              successCount: 0,
              failureCount: 12,
              summary: null,
              failureSummary: "12 条记录金额格式不合法",
              inputFileName: "payments.csv",
              resultFileName: null,
              failureFileName: "payments-failures.csv",
              operator: {
                displayName: "李菲"
              },
              startedAt: "2026-04-12T08:00:00.000Z",
              finishedAt: "2026-04-12T08:12:00.000Z",
              updatedAt: "2026-04-12T08:12:00.000Z"
            }
          ]
        });
      }

      return Promise.resolve({ data: [] });
    });

    postMock.mockResolvedValue({ data: {} });
    patchMock.mockResolvedValue({ data: {} });
  }

  function createWrapper() {
    return shallowMount(SystemAdminPage, {
      global: {
        stubs: {
          "el-tabs": true,
          "el-tab-pane": true,
          "el-form": true,
          "el-form-item": true,
          "el-input": true,
          "el-select": true,
          "el-option": true,
          "el-date-picker": true,
          "el-button": true,
          "el-table": true,
          "el-table-column": true,
          "el-empty": true,
          "el-pagination": true,
          "el-dialog": true,
          "el-row": true,
          "el-col": true,
          "el-input-number": true,
          "el-switch": true,
          "el-checkbox-group": true,
          "el-checkbox": true
        }
      }
    });
  }

  it("requests paginated audit logs when the actor filter changes", async () => {
    getMock.mockReset();
    mockSystemAdminRequests();

    const wrapper = createWrapper();
    await flushPromises();

    (wrapper.vm as any).auditFilter.actorName = "管理员";
    await flushPromises();

    expect(getMock).toHaveBeenLastCalledWith("/audit-logs", {
      params: {
        actorName: "管理员",
        actionType: undefined,
        targetType: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 1,
        pageSize: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      }
    });
  });

  it("filters batch tasks by failed status in governance view", async () => {
    getMock.mockReset();
    mockSystemAdminRequests();

    const wrapper = createWrapper();
    await flushPromises();

    expect((wrapper.vm as any).visibleBatchTasks).toHaveLength(3);

    (wrapper.vm as any).batchTaskFilters.status = "FAILED";
    await flushPromises();

    expect((wrapper.vm as any).visibleBatchTasks).toHaveLength(1);
    expect((wrapper.vm as any).visibleBatchTasks[0].label).toBe("回款导入");
    expect(getMock).toHaveBeenLastCalledWith("/batch-tasks", {
      params: {
        category: undefined,
        status: "FAILED",
        resourceType: undefined
      }
    });
  });

  it("loads open integration resources on mount", async () => {
    getMock.mockReset();
    mockSystemAdminRequests();

    createWrapper();
    await flushPromises();

    expect(getMock).toHaveBeenCalledWith("/open-integration/credentials");
    expect(getMock).toHaveBeenCalledWith("/open-integration/webhooks");
    expect(getMock).toHaveBeenCalledWith("/open-integration/connectors");
  });

  it("does not request platform governance resources on mount", async () => {
    getMock.mockReset();
    mockSystemAdminRequests();

    createWrapper();
    await flushPromises();

    expect(getMock).not.toHaveBeenCalledWith("/system-governance/notification-channels");
    expect(getMock).not.toHaveBeenCalledWith("/system-governance/storage-configs");
    expect(getMock).not.toHaveBeenCalledWith("/system-governance/scheduler-jobs");
  });

  it("creates open api credentials and stores the one-time secret notice", async () => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    mockSystemAdminRequests();
    postMock.mockResolvedValueOnce({
      data: {
        ...buildOpenApiCredential(),
        plainSecret: "opsk_secret_value"
      }
    });

    const wrapper = createWrapper();
    await flushPromises();

    (wrapper.vm as any).openApiCredentialForm.name = "经营分析只读";
    (wrapper.vm as any).openApiCredentialForm.scopes = ["customer:read"];
    await (wrapper.vm as any).submitOpenApiCredential();
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith("/open-integration/credentials", {
      name: "经营分析只读",
      scopes: ["customer:read"],
      expiresAt: undefined
    });
    expect((wrapper.vm as any).secretRevealNotice).toMatchObject({
      type: "credential",
      secret: "opsk_secret_value"
    });
  });

  it("submits identity connectors with parsed domain and config payload", async () => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    mockSystemAdminRequests();
    postMock.mockResolvedValueOnce({
      data: buildIdentityConnector()
    });

    const wrapper = createWrapper();
    await flushPromises();

    (wrapper.vm as any).identityConnectorForm.name = "企业 OAuth";
    (wrapper.vm as any).identityConnectorForm.type = "OAUTH";
    (wrapper.vm as any).identityConnectorForm.status = "ACTIVE";
    (wrapper.vm as any).identityConnectorForm.matchField = "EMAIL";
    (wrapper.vm as any).identityConnectorForm.allowedDomainsText = "acme.test, finance.acme.test";
    (wrapper.vm as any).identityConnectorForm.configText = "{\"group\":\"finance\"}";
    await (wrapper.vm as any).submitIdentityConnector();
    await flushPromises();

    expect(postMock).toHaveBeenCalledWith("/open-integration/connectors", {
      name: "企业 OAuth",
      type: "OAUTH",
      status: "ACTIVE",
      matchField: "EMAIL",
      issuerUrl: undefined,
      authorizeUrl: undefined,
      tokenUrl: undefined,
      directoryUrl: undefined,
      clientId: undefined,
      clientSecret: undefined,
      allowedDomains: ["acme.test", "finance.acme.test"],
      config: {
        group: "finance"
      }
    });
  });
});
