import { flushPromises, shallowMount } from "@vue/test-utils";

import AccessControlPage from "./AccessControlPage.vue";

const { getMock, postMock, patchMock, successMock, errorMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  successMock: vi.fn(),
  errorMock: vi.fn()
}));

vi.mock("../api/http", () => ({
  http: {
    get: getMock,
    post: postMock,
    patch: patchMock
  }
}));

vi.mock("element-plus", () => ({
  ElMessage: {
    success: successMock,
    error: errorMock
  }
}));

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

describe("AccessControlPage", () => {
  beforeEach(() => {
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
    const wrapper = shallowMount(AccessControlPage, {
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

  it("sends nullable fields when clearing optional user data during update", async () => {
    const wrapper = shallowMount(AccessControlPage, {
      global: {
        stubs: globalStubs
      }
    });
    await flushPromises();

    (wrapper.vm as any).userFormRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn()
    };
    (wrapper.vm as any).userForm.id = "user-1";
    (wrapper.vm as any).userForm.displayName = " 王小明 ";
    (wrapper.vm as any).userForm.password = "";
    (wrapper.vm as any).userForm.email = "";
    (wrapper.vm as any).userForm.phone = " ";
    (wrapper.vm as any).userForm.departmentId = null;
    (wrapper.vm as any).userForm.roleIds = [" role-1 "];

    await (wrapper.vm as any).submitUser();

    expect(patchMock).toHaveBeenCalledWith("/users/user-1", {
      displayName: "王小明",
      password: undefined,
      email: null,
      phone: null,
      departmentId: null,
      roleIds: ["role-1"]
    });
  });
});
