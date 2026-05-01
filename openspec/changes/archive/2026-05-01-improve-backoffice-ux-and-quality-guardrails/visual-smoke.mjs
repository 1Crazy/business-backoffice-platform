import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const outputDir = "/tmp/backoffice-visual-smoke";

const currentUser = {
  id: "visual-user",
  tenantId: "tenant-visual",
  tenantCode: "visual",
  username: "visual.admin",
  displayName: "视觉验证账号",
  roleCodes: ["super-admin"],
  permissions: [
    "department:read",
    "user:read",
    "role:read",
    "tenant:read",
    "product-config:read",
    "oa:workspace:view",
    "oa:approval:read",
    "oa:request:approve",
    "oa:request:apply",
    "oa:leave:apply",
    "oa:announcement:read",
    "oa:directory:read",
    "dashboard:view",
    "customer:read",
    "opportunity:read",
    "lead:read",
    "dictionary:read"
  ]
};

const cases = [
  ["desktop-host-workfeed", "http://localhost:5175/workfeed", 1440, 960, "统一待办"],
  ["desktop-host-oa-workspace", "http://localhost:5175/oa/workspace", 1440, 960, "工作台"],
  ["desktop-host-scrm-system", "http://localhost:5175/scrm/system", 1440, 960, "系统管理"],
  ["desktop-standalone-oa", "http://localhost:5174/workspace", 1440, 960, "工作台"],
  ["desktop-standalone-scrm", "http://localhost:5173/dashboard", 1440, 960, "运营看板"],
  ["mobile-host-workfeed", "http://localhost:5175/workfeed", 390, 844, "统一待办"],
  ["mobile-host-oa-workspace", "http://localhost:5175/oa/workspace", 390, 844, "工作台"],
  ["mobile-host-scrm-system", "http://localhost:5175/scrm/system", 390, 844, "系统管理"]
];

function jsonResponse(value) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(value)
  };
}

async function seedBrowserContext(context) {
  await context.addInitScript((user) => {
    window.localStorage.setItem("platform-access-token", "visual-access-token");
    window.localStorage.setItem("platform-refresh-token", "visual-refresh-token");
    window.localStorage.setItem("platform-session-expires-at", "2099-01-01T00:00:00.000Z");
    window.__VISUAL_USER__ = user;
  }, currentUser);
}

async function installApiMocks(page) {
  await page.route("http://localhost:3000/api/auth/profile**", async (route) => route.fulfill(jsonResponse(currentUser)));
  await page.route("http://localhost:3000/api/auth/refresh", async (route) =>
    route.fulfill(
      jsonResponse({
        accessToken: "visual-access-token",
        refreshToken: "visual-refresh-token",
        sessionExpiresAt: "2099-01-01T00:00:00.000Z",
        user: currentUser
      })
    )
  );
  await page.route("http://localhost:3000/api/product-configuration/runtime**", async (route) =>
    route.fulfill(
      jsonResponse({
        brandName: "视觉验证工作台",
        hiddenNavigationKeys: [],
        navigationLabels: {},
        primaryColor: "#2563eb",
        accentColor: "#0f172a",
        surfaceTint: "#eff6ff"
      })
    )
  );
  await page.route("http://localhost:3000/api/workfeed/todos**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "todo-1",
          domain: "oa",
          type: "LEAVE_APPROVAL",
          title: "审批请假单",
          summary: "张三提交了请假申请",
          priority: "HIGH",
          dueAt: null,
          status: "PENDING",
          targetPath: "/oa/approvals/pending",
          targetLabel: "待我审批",
          sourceId: "leave-1",
          createdAt: "2026-05-01T00:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/workfeed/notifications**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "notice-1",
          domain: "oa",
          type: "ANNOUNCEMENT",
          title: "组织公告",
          summary: "发布新的办公通知",
          priority: "MEDIUM",
          targetPath: "/oa/announcements",
          targetLabel: "公告",
          sourceId: "announcement-1",
          occurredAt: "2026-05-01T00:00:00.000Z",
          isRead: false,
          readAt: null
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/workfeed/notifications/read**", async (route) =>
    route.fulfill(jsonResponse({ success: true }))
  );
  await page.route("http://localhost:3000/api/notification-center/preferences**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "pref-1",
          domain: "OA",
          eventType: "WORKFLOW_RESULT",
          subscribed: true,
          inAppEnabled: true,
          emailEnabled: true,
          enterpriseImEnabled: false,
          digestMode: "DAILY",
          reminderFrequencyMinutes: 60,
          nudgeThresholdMinutes: 240,
          quietHours: null,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z"
        },
        {
          id: "pref-2",
          domain: "OA",
          eventType: "ANNOUNCEMENT",
          subscribed: true,
          inAppEnabled: true,
          emailEnabled: true,
          enterpriseImEnabled: false,
          digestMode: "DAILY",
          reminderFrequencyMinutes: 60,
          nudgeThresholdMinutes: 240,
          quietHours: null,
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/workfeed/**", async (route) =>
    route.fulfill(
      jsonResponse({
        items: [],
        total: 0
      })
    )
  );
  await page.route("http://localhost:3000/api/oa/workspace/overview**", async (route) => {
    await route.fulfill(
      jsonResponse({
        pendingApprovalCount: 1,
        myRequestCount: 1,
        administrativeRequestPendingCount: 1,
        administrativeRequestMyCount: 1,
        activeAnnouncementCount: 1,
        directoryDepartmentCount: 3,
        recentAnnouncements: [
          {
            id: "announcement-1",
            title: "组织公告",
            summary: "发布新的办公通知",
            publishedAt: "2026-05-01T00:00:00.000Z",
            publishedByName: "系统管理员"
          }
        ]
      })
    );
  });
  await page.route("http://localhost:3000/api/workflows/templates/active**", async (route) => {
    await route.fulfill(
      jsonResponse([
        { key: "LEAVE", name: "请假", version: 1 },
        { key: "REIMBURSEMENT", name: "报销", version: 1 }
      ])
    );
  });
  await page.route("http://localhost:3000/api/workflows/tasks/pending**", async (route) => {
    await route.fulfill(
      jsonResponse([
        {
          id: "pending-1",
          instanceId: "instance-1",
          nodeKey: "review",
          nodeName: "审批",
          title: "请假单",
          businessKey: "leave-1",
          status: "IN_PROGRESS",
          template: { id: "template-1", key: "LEAVE", name: "请假", version: 1 },
          applicant: { id: "user-1", displayName: "张三" },
          formData: {},
          submittedAt: "2026-05-01T00:00:00.000Z"
        }
      ])
    );
  });
  await page.route("http://localhost:3000/api/workflows/instances/mine**", async (route) => {
    await route.fulfill(
      jsonResponse([
        {
          id: "instance-1",
          title: "请假单",
          status: "IN_PROGRESS",
          template: { id: "template-1", key: "LEAVE", name: "请假", version: 1 },
          applicant: { id: "user-1", displayName: "张三" },
          formData: {},
          tasks: [],
          actions: [],
          ccRecipients: [],
          submittedAt: "2026-05-01T00:00:00.000Z",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z"
        }
      ])
    );
  });
  await page.route("http://localhost:3000/api/oa/**", async (route) => {
    await route.fulfill(jsonResponse([]));
  });
  await page.route("http://localhost:3000/api/dashboard/**", async (route) =>
    route.fulfill(
      jsonResponse({
        startDate: "2026-04-01",
        endDate: "2026-05-01",
        departmentId: null,
        ownerId: null,
        departments: [
          { id: "dept-1", name: "销售一部" },
          { id: "dept-2", name: "销售二部" }
        ],
        owners: [
          { id: "owner-1", displayName: "李四", departmentId: "dept-1", departmentName: "销售一部" }
        ],
        newCustomers: 12,
        followUpCount: 24,
        convertedLeads: 5,
        totalLeads: 40,
        conversionRate: 12.5,
        pendingReminders: 3,
        newOpportunities: 8,
        pipelineForecastAmount: 520000,
        wonOpportunities: 2,
        wonAmount: 180000,
        opportunityWinRate: 25,
        salesFunnel: [
          { key: "new", label: "新增", count: 10, amount: 100000 }
        ],
        ownerPerformanceRanking: [
          {
            id: "owner-1",
            label: "李四",
            departmentName: "销售一部",
            wonAmount: 180000,
            receivedAmount: 120000,
            newCustomers: 4,
            wonOpportunities: 2
          }
        ],
        departmentPerformanceRanking: [
          {
            id: "dept-1",
            label: "销售一部",
            departmentName: "销售一部",
            wonAmount: 180000,
            receivedAmount: 120000,
            newCustomers: 4,
            wonOpportunities: 2
          }
        ],
        receivableForecast: {
          plannedAmount: 520000,
          receivedAmount: 180000,
          unreceivedAmount: 340000,
          overdueAmount: 12000
        },
        approvalTimeliness: {
          averageHours: 6,
          leaveAverageHours: 5,
          administrativeAverageHours: 7,
          completedCount: 14,
          pendingOver48Hours: 1
        }
      })
    )
  );
  await page.route("http://localhost:3000/api/dictionaries**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "dict-visual",
          type: "customer-source",
          label: "官网注册",
          value: "website",
          sort: 1,
          enabled: true,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/audit-logs**", async (route) =>
    route.fulfill(
      jsonResponse({
        items: [
          {
            id: "audit-visual",
            actorId: "visual-user",
            actorName: "视觉验证账号",
            actionType: "UPDATE",
            targetType: "webhook",
            targetId: "webhook-visual",
            detail: { source: "visual-smoke" },
            createdAt: "2026-05-01T12:00:00.000Z"
          }
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1
      })
    )
  );
  await page.route("http://localhost:3000/api/batch-tasks**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "batch-visual",
          category: "IMPORT",
          resourceType: "CUSTOMER",
          label: "客户导入任务",
          status: "SUCCEEDED",
          progress: 100,
          totalCount: 120,
          successCount: 118,
          failureCount: 2,
          summary: "视觉验证批处理任务",
          failureSummary: "2 条测试失败",
          inputFileName: "customers.xlsx",
          resultFileName: "customers-result.xlsx",
          failureFileName: "customers-failed.xlsx",
          operator: { displayName: "视觉验证账号" },
          startedAt: "2026-05-01T11:00:00.000Z",
          finishedAt: "2026-05-01T11:05:00.000Z",
          updatedAt: "2026-05-01T11:05:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/open-integration/credentials**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "credential-visual",
          name: "视觉验证凭证",
          accessKey: "ak_visual",
          secretKeyHint: "sk_vi...test",
          status: "ACTIVE",
          allowedIps: [],
          scopes: ["webhook:read"],
          lastUsedAt: "2026-05-01T12:00:00.000Z",
          expiresAt: null,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/open-integration/webhooks/*/deliveries", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "delivery-visual",
          eventType: "GOVERNANCE_ALERT",
          sourceType: "system-administration",
          sourceId: "webhook-visual",
          status: "SUCCEEDED",
          attemptCount: 1,
          deliveryMode: "REAL",
          durationMs: 88,
          signature: "sha256=visual",
          responseStatusCode: 202,
          responseBody: "accepted",
          errorMessage: null,
          nextRetryAt: null,
          deliveredAt: "2026-05-01T12:00:00.000Z",
          createdAt: "2026-05-01T12:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/open-integration/webhooks", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "webhook-visual",
          name: "视觉验证回调",
          endpointUrl: "https://hooks.example.com/webhook",
          eventTypes: ["GOVERNANCE_ALERT"],
          status: "ACTIVE",
          signingSecretHint: "whs_vi...test",
          maxAttempts: 3,
          timeoutSeconds: 10,
          lastTriggeredAt: "2026-05-01T12:00:00.000Z",
          lastDeliveryStatus: "SUCCEEDED",
          lastFailureMessage: null,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z"
        }
      ])
    )
  );
  await page.route("http://localhost:3000/api/open-integration/connectors**", async (route) =>
    route.fulfill(
      jsonResponse([
        {
          id: "connector-visual",
          name: "视觉验证 SSO",
          provider: "OIDC",
          issuerUrl: "https://id.example.com",
          clientId: "visual-client",
          status: "ACTIVE",
          syncEnabled: true,
          lastSyncedAt: "2026-05-01T12:00:00.000Z",
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z"
        }
      ])
    )
  );
}

async function runCase(browser, [name, url, width, height, expectedText]) {
  const context = await browser.newContext({
    viewport: { width, height }
  });
  await seedBrowserContext(context);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => consoleErrors.push(error.stack || error.message));
  await installApiMocks(page);
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1200);

  const text = await page.locator("body").innerText();
  const screenshotPath = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const slot = document.querySelector("#micro-app-slot");

    return {
      bodyLength: document.body.innerText.length,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 2,
      hasMicroSlot: Boolean(slot),
      microSlotTextLength: slot?.textContent?.trim().length ?? 0,
      hasVisibleScrollbar: root.scrollHeight > root.clientHeight
    };
  });
  await context.close();

  return {
    name,
    url,
    viewport: `${width}x${height}`,
    screenshotPath,
    passed: text.includes(expectedText) && !metrics.hasHorizontalOverflow && consoleErrors.length === 0,
    expectedTextFound: text.includes(expectedText),
    consoleErrors,
    metrics
  };
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

for (const testCase of cases) {
  results.push(await runCase(browser, testCase));
}

await browser.close();
const reportPath = path.join(outputDir, "report.json");
await writeFile(reportPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ reportPath, results }, null, 2));

if (results.some((item) => !item.passed)) {
  process.exitCode = 1;
}
