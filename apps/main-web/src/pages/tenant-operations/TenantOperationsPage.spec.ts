// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TenantOperationsPage from "@/pages/tenant-operations/TenantOperationsPage.vue";

const { getMock, postMock, patchMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("@/api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", async () => {
  const actual = await vi.importActual<typeof import("element-plus")>("element-plus");

  return {
    ...actual,
    ElMessage: {
      success: successMock,
      error: errorMock
    }
  };
});

const globalStubs = {
  "el-table": true,
  "el-table-column": true,
  "el-tag": true,
  "el-input": true,
  "el-select": true,
  "el-option": true,
  "el-button": true,
  "el-drawer": true,
  "el-dialog": true,
  "el-form": true,
  "el-form-item": true,
  "el-input-number": true
};

const tenantFixture = {
  id: "tenant-1",
  code: "acme",
  name: "Acme",
  status: "ACTIVE",
  lifecycleStatus: "ACTIVE",
  isDefault: false,
  industry: "制造业",
  planName: "企业版",
  ownerName: "王强",
  ownerEmail: "wangqiang@acme.test",
  ownerPhone: null,
  initializedAt: "2026-04-17T08:00:00.000Z",
  disabledAt: null,
  archivedAt: null,
  createdAt: "2026-04-17T08:00:00.000Z",
  updatedAt: "2026-04-17T08:00:00.000Z",
  quotas: {
    users: 20,
    storageQuotaMb: 1024,
    monthlyTasks: 2000
  },
  usage: {
    totalUsers: 18,
    activeUsers: 16,
    storageUsedMb: 900,
    monthlyTasks: 1700,
    failedTasksLast30Days: 1,
    notificationFailuresLast7Days: 0,
    lastActivityAt: "2026-04-17T09:00:00.000Z"
  },
  runtimeStatus: "WARNING",
  runtimeHighlights: ["用户配额接近上限（18/20）。"]
};

describe("TenantOperationsPage", () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();

    getMock.mockResolvedValue({ data: [tenantFixture] });
    postMock.mockResolvedValue({ data: {} });
    patchMock.mockResolvedValue({ data: {} });
  });

  it("normalizes tenant create payloads before posting", async () => {
    const wrapper = shallowMount(TenantOperationsPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).createFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).createForm.code = " ACME-NEW ";
    (wrapper.vm as any).createForm.name = " Acme 新租户 ";
    (wrapper.vm as any).createForm.industry = " 制造业 ";
    (wrapper.vm as any).createForm.ownerName = " 王强 ";
    (wrapper.vm as any).createForm.ownerEmail = " owner@acme.test ";
    (wrapper.vm as any).createForm.ownerPhone = " 13800000000 ";
    (wrapper.vm as any).createForm.adminUsername = " acme.admin ";
    (wrapper.vm as any).createForm.adminDisplayName = " Acme 管理员 ";
    (wrapper.vm as any).createForm.adminPassword = " Admin123456! ";

    await (wrapper.vm as any).submitCreate();

    expect(postMock).toHaveBeenCalledWith("/tenant-operations/tenants", {
      code: "acme-new",
      name: "Acme 新租户",
      industry: "制造业",
      planName: undefined,
      ownerName: "王强",
      ownerEmail: "owner@acme.test",
      ownerPhone: "13800000000",
      adminUsername: "acme.admin",
      adminDisplayName: "Acme 管理员",
      adminPassword: "Admin123456!",
      userQuota: 50,
      storageQuotaMb: 5120,
      monthlyTaskQuota: 10000
    });
  });

  it("updates tenant quotas with the selected tenant id", async () => {
    const wrapper = shallowMount(TenantOperationsPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    await (wrapper.vm as any).openQuotaDialog(tenantFixture);
    (wrapper.vm as any).quotaFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).quotaForm.userQuota = 30;
    (wrapper.vm as any).quotaForm.storageQuotaMb = 2048;
    (wrapper.vm as any).quotaForm.monthlyTaskQuota = 5000;

    await (wrapper.vm as any).submitQuotaUpdate();

    expect(patchMock).toHaveBeenCalledWith("/tenant-operations/tenants/tenant-1/quotas", {
      userQuota: 30,
      storageQuotaMb: 2048,
      monthlyTaskQuota: 5000
    });
  });
});
