// @vitest-environment jsdom

import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PlatformGovernancePage from "@/pages/platform-governance/PlatformGovernancePage.vue";

const { getMock, postMock, patchMock, pushMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  pushMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: "/platform/organization/departments",
    meta: {
      governanceTab: "departments"
    }
  }),
  useRouter: () => ({
    push: pushMock
  })
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
  "el-tabs": true,
  "el-tab-pane": true,
  "el-form": true,
  "el-form-item": true,
  "el-input": true,
  "el-select": true,
  "el-option": true,
  "el-button": true,
  "el-table": true,
  "el-table-column": true,
  "el-tag": true,
  "el-row": true,
  "el-col": true,
  "el-dialog": true,
  "el-checkbox-group": true,
  "el-checkbox": true
};

describe("PlatformGovernancePage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();

    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
    patchMock.mockResolvedValue({ data: {} });
  });

  it("normalizes department create payloads before posting", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).departmentFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).departmentForm.name = " 北区销售 ";
    (wrapper.vm as any).departmentForm.code = " SALES-NORTH ";
    (wrapper.vm as any).departmentForm.parentId = null;

    await (wrapper.vm as any).submitDepartment();

    expect(postMock).toHaveBeenCalledWith("/departments", {
      name: "北区销售",
      code: "SALES-NORTH",
      parentId: undefined
    });
  });

  it("derives the current governance tab from route metadata", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });

    expect((wrapper.vm as any).currentTab).toBe("departments");
  });

  it("includes data scope when creating a role policy", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).roleFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).roleForm.name = " 区域审批主管 ";
    (wrapper.vm as any).roleForm.code = " area-approval-manager ";
    (wrapper.vm as any).roleForm.description = " 负责区域审批 ";
    (wrapper.vm as any).roleForm.dataScope = "DEPARTMENT_AND_SUBTREE";
    (wrapper.vm as any).roleForm.permissionIds = ["perm-1", "perm-2"];
    (wrapper.vm as any).roleForm.extendedDataScopes = [
      {
        dimension: "REGION",
        values: [" 华东一区 ", "华南二区"],
        note: " 区域负责人 "
      }
    ];
    (wrapper.vm as any).roleForm.fieldPermissionRules = [
      {
        resource: " customer ",
        field: " mobile ",
        visibility: "MASKED"
      }
    ];
    (wrapper.vm as any).roleForm.actionPermissionRules = [
      {
        resource: " approval ",
        action: " export ",
        allowed: false
      }
    ];

    await (wrapper.vm as any).submitRole();

    expect(postMock).toHaveBeenCalledWith("/roles", {
      name: "区域审批主管",
      code: "area-approval-manager",
      description: "负责区域审批",
      dataScope: "DEPARTMENT_AND_SUBTREE",
      permissionIds: ["perm-1", "perm-2"],
      policyBundle: {
        extendedDataScopes: [
          {
            dimension: "REGION",
            values: ["华东一区", "华南二区"],
            note: "区域负责人"
          }
        ],
        fieldPermissionRules: [
          {
            resource: "customer",
            field: "mobile",
            visibility: "MASKED"
          }
        ],
        actionPermissionRules: [
          {
            resource: "approval",
            action: "export",
            allowed: false
          }
        ]
      }
    });
  });

  it("hydrates granular rules when editing an existing role", async () => {
    const wrapper = shallowMount(PlatformGovernancePage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    await (wrapper.vm as any).openRoleDialog({
      id: "role-1",
      name: "销售经理",
      code: "sales-manager",
      description: "销售角色",
      status: "ACTIVE",
      dataScope: "DEPARTMENT",
      extendedDataScopes: [
        {
          dimension: "TEAM",
          values: ["A 组"],
          note: "核心团队"
        }
      ],
      fieldPermissionRules: [
        {
          resource: "customer",
          field: "mobile",
          visibility: "READONLY"
        }
      ],
      actionPermissionRules: [
        {
          resource: "revenue",
          action: "confirm-payment",
          allowed: true
        }
      ],
      permissions: [
        {
          permission: {
            id: "perm-1",
            appCode: "scrm",
            name: "查看客户",
            code: "customer:read",
            group: "customer"
          }
        }
      ]
    });

    expect((wrapper.vm as any).roleForm.extendedDataScopes).toEqual([
      {
        dimension: "TEAM",
        values: ["A 组"],
        note: "核心团队"
      }
    ]);
    expect((wrapper.vm as any).roleForm.fieldPermissionRules).toEqual([
      {
        resource: "customer",
        field: "mobile",
        visibility: "READONLY"
      }
    ]);
    expect((wrapper.vm as any).roleForm.actionPermissionRules).toEqual([
      {
        resource: "revenue",
        action: "confirm-payment",
        allowed: true
      }
    ]);
  });
});
