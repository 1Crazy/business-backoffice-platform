/** 平台治理 composable：负责组织、员工和角色治理页面的状态编排与提交流程。 */
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { nextTick, onMounted, reactive, ref } from "vue";

import {
  createDepartment,
  createRole,
  createUser,
  fetchAccessControlData,
  toggleDepartmentStatus,
  toggleRoleStatus,
  toggleUserStatus,
  updateDepartment,
  updateRole,
  updateUser
} from "@/api/access-control.api";
import type {
  CreateRolePayload,
  CreateUserPayload,
  Department,
  DepartmentFormModel,
  PermissionItem,
  Role,
  RoleFormModel,
  SaveDepartmentPayload,
  UpdateRolePayload,
  UpdateUserPayload,
  User,
  UserFormModel
} from "@/types/access-control";
import {
  normalizeOptionalTextForCreate,
  normalizeOptionalTextForUpdate,
  normalizeRequiredText,
  normalizeStringList
} from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

export function useAccessControlPage() {
  const departments = ref<Department[]>([]);
  const users = ref<User[]>([]);
  const roles = ref<Role[]>([]);
  const permissionCatalog = ref<PermissionItem[]>([]);
  const isLoading = ref(true);

  const departmentDialogVisible = ref(false);
  const userDialogVisible = ref(false);
  const roleDialogVisible = ref(false);

  const departmentFormRef = ref<FormInstance>();
  const userFormRef = ref<FormInstance>();
  const roleFormRef = ref<FormInstance>();

  const departmentForm = reactive<DepartmentFormModel>({
    id: "",
    name: "",
    code: "",
    parentId: null
  });

  const userForm = reactive<UserFormModel>({
    id: "",
    username: "",
    displayName: "",
    password: "",
    email: "",
    phone: "",
    departmentId: null,
    roleIds: []
  });

  const roleForm = reactive<RoleFormModel>({
    id: "",
    name: "",
    code: "",
    description: "",
    permissionIds: []
  });

  const departmentRules: FormRules<DepartmentFormModel> = {
    name: [
      { required: true, message: "请输入部门名称", trigger: "blur" },
      { min: 2, message: "部门名称至少需要 2 个字符", trigger: "blur" }
    ],
    code: [
      { required: true, message: "请输入部门编码", trigger: "blur" },
      { min: 2, message: "部门编码至少需要 2 个字符", trigger: "blur" }
    ]
  };

  const userRules: FormRules<UserFormModel> = {
    username: [
      { required: true, message: "请输入账号", trigger: "blur" },
      { min: 3, message: "账号至少需要 3 个字符", trigger: "blur" }
    ],
    displayName: [
      { required: true, message: "请输入姓名", trigger: "blur" },
      { min: 2, message: "姓名至少需要 2 个字符", trigger: "blur" }
    ],
    password: [
      {
        validator: (_rule, value: string, callback) => {
          const normalized = value.trim();

          // 新建用户必须提供密码；编辑用户时允许留空以表示“不修改现有密码”。
          if (!userForm.id && !normalized) {
            callback(new Error("请输入密码"));
            return;
          }

          if (normalized && normalized.length < 8) {
            callback(new Error("密码至少需要 8 位"));
            return;
          }

          callback();
        },
        trigger: "blur"
      }
    ],
    departmentId: [{ required: true, message: "请选择部门", trigger: "change" }],
    roleIds: [{ type: "array", required: true, min: 1, message: "请至少选择一个角色", trigger: "change" }],
    email: [{ type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }]
  };

  const roleRules: FormRules<RoleFormModel> = {
    name: [
      { required: true, message: "请输入角色名称", trigger: "blur" },
      { min: 2, message: "角色名称至少需要 2 个字符", trigger: "blur" }
    ],
    code: [
      { required: true, message: "请输入角色编码", trigger: "blur" },
      { min: 2, message: "角色编码至少需要 2 个字符", trigger: "blur" }
    ],
    permissionIds: [{ type: "array", required: true, min: 1, message: "请至少勾选一个权限点", trigger: "change" }]
  };

  function setDepartmentFormRef(instance: FormInstance | undefined): void {
    departmentFormRef.value = instance;
  }

  function setUserFormRef(instance: FormInstance | undefined): void {
    userFormRef.value = instance;
  }

  function setRoleFormRef(instance: FormInstance | undefined): void {
    roleFormRef.value = instance;
  }

  function buildDepartmentCreatePayload(): SaveDepartmentPayload {
    return {
      name: normalizeRequiredText(departmentForm.name),
      code: normalizeRequiredText(departmentForm.code),
      parentId: normalizeOptionalTextForCreate(departmentForm.parentId)
    };
  }

  function buildDepartmentUpdatePayload(): SaveDepartmentPayload {
    return {
      name: normalizeRequiredText(departmentForm.name),
      code: normalizeRequiredText(departmentForm.code),
      parentId: normalizeOptionalTextForUpdate(departmentForm.parentId)
    };
  }

  function buildUserCreatePayload(): CreateUserPayload {
    return {
      username: normalizeRequiredText(userForm.username),
      displayName: normalizeRequiredText(userForm.displayName),
      password: normalizeRequiredText(userForm.password),
      email: normalizeOptionalTextForCreate(userForm.email),
      phone: normalizeOptionalTextForCreate(userForm.phone),
      departmentId: normalizeOptionalTextForCreate(userForm.departmentId),
      roleIds: normalizeStringList(userForm.roleIds)
    };
  }

  // 用户更新时允许把邮箱、手机号和部门清空，因此这里需要使用 update 语义的归一化规则。
  function buildUserUpdatePayload(): UpdateUserPayload {
    return {
      displayName: normalizeRequiredText(userForm.displayName),
      password: normalizeOptionalTextForCreate(userForm.password),
      email: normalizeOptionalTextForUpdate(userForm.email),
      phone: normalizeOptionalTextForUpdate(userForm.phone),
      departmentId: normalizeOptionalTextForUpdate(userForm.departmentId),
      roleIds: normalizeStringList(userForm.roleIds)
    };
  }

  function buildRoleCreatePayload(): CreateRolePayload {
    return {
      name: normalizeRequiredText(roleForm.name),
      code: normalizeRequiredText(roleForm.code),
      description: normalizeOptionalTextForCreate(roleForm.description),
      permissionIds: normalizeStringList(roleForm.permissionIds)
    };
  }

  function buildRoleUpdatePayload(): UpdateRolePayload {
    return {
      name: normalizeRequiredText(roleForm.name),
      description: normalizeOptionalTextForUpdate(roleForm.description),
      permissionIds: normalizeStringList(roleForm.permissionIds)
    };
  }

  async function loadData(): Promise<void> {
    if (departments.value.length === 0 && users.value.length === 0 && roles.value.length === 0) {
      isLoading.value = true;
    }

    try {
      const data = await fetchAccessControlData();

      departments.value = data.departments;
      users.value = data.users;
      roles.value = data.roles;
      permissionCatalog.value = data.permissionCatalog;
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "平台治理数据加载失败，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  async function openDepartmentDialog(department?: Department): Promise<void> {
    departmentForm.id = department?.id ?? "";
    departmentForm.name = department?.name ?? "";
    departmentForm.code = department?.code ?? "";
    departmentForm.parentId = department?.parentId ?? null;
    departmentDialogVisible.value = true;
    await nextTick();
    departmentFormRef.value?.clearValidate();
  }

  async function submitDepartment(): Promise<void> {
    const isValid = await validateForm(departmentFormRef.value);

    if (!isValid) {
      return;
    }

    // 部门树只做轻量前置保护，至少先拦住“自己挂自己”这种最明显的环路。
    if (departmentForm.id && departmentForm.parentId === departmentForm.id) {
      ElMessage.error("上级部门不能选择自己。");
      return;
    }

    try {
      if (departmentForm.id) {
        await updateDepartment(departmentForm.id, buildDepartmentUpdatePayload());
      } else {
        await createDepartment(buildDepartmentCreatePayload());
      }

      departmentDialogVisible.value = false;
      ElMessage.success("部门已保存。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "部门保存失败，请检查表单后重试。"));
    }
  }

  async function toggleDepartment(department: Department): Promise<void> {
    try {
      await toggleDepartmentStatus(department);
      ElMessage.success("部门状态已更新。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "部门状态更新失败，请稍后重试。"));
    }
  }

  async function openUserDialog(user?: User): Promise<void> {
    userForm.id = user?.id ?? "";
    userForm.username = user?.username ?? "";
    userForm.displayName = user?.displayName ?? "";
    userForm.password = "";
    userForm.email = user?.email ?? "";
    userForm.phone = user?.phone ?? "";
    userForm.departmentId = user?.departmentId ?? null;
    // 编辑态只保留 role.id，避免把嵌套关系对象直接塞进表单模型导致提交 payload 污染。
    userForm.roleIds = user ? user.roles.map((item) => item.role.id) : [];
    userDialogVisible.value = true;
    await nextTick();
    userFormRef.value?.clearValidate();
  }

  async function submitUser(): Promise<void> {
    const isValid = await validateForm(userFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (userForm.id) {
        await updateUser(userForm.id, buildUserUpdatePayload());
      } else {
        await createUser(buildUserCreatePayload());
      }

      userDialogVisible.value = false;
      ElMessage.success("员工已保存。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "员工保存失败，请检查表单后重试。"));
    }
  }

  async function toggleUser(user: User): Promise<void> {
    try {
      await toggleUserStatus(user);
      ElMessage.success("员工状态已更新。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "员工状态更新失败，请稍后重试。"));
    }
  }

  async function openRoleDialog(role?: Role): Promise<void> {
    roleForm.id = role?.id ?? "";
    roleForm.name = role?.name ?? "";
    roleForm.code = role?.code ?? "";
    roleForm.description = role?.description ?? "";
    roleForm.permissionIds = role ? role.permissions.map((item) => item.permission.id) : [];
    roleDialogVisible.value = true;
    await nextTick();
    roleFormRef.value?.clearValidate();
  }

  async function submitRole(): Promise<void> {
    const isValid = await validateForm(roleFormRef.value);

    if (!isValid) {
      return;
    }

    try {
      if (roleForm.id) {
        await updateRole(roleForm.id, buildRoleUpdatePayload());
      } else {
        await createRole(buildRoleCreatePayload());
      }

      roleDialogVisible.value = false;
      ElMessage.success("角色已保存。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "角色保存失败，请检查表单后重试。"));
    }
  }

  async function toggleRole(role: Role): Promise<void> {
    try {
      await toggleRoleStatus(role);
      ElMessage.success("角色状态已更新。");
      await loadData();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "角色状态更新失败，请稍后重试。"));
    }
  }

  onMounted(() => {
    void loadData();
  });

  return {
    departmentDialogVisible,
    departmentForm,
    departmentRules,
    departments,
    isLoading,
    loadData,
    openDepartmentDialog,
    openRoleDialog,
    openUserDialog,
    permissionCatalog,
    roleDialogVisible,
    roleForm,
    roleRules,
    roles,
    setDepartmentFormRef,
    setRoleFormRef,
    setUserFormRef,
    submitDepartment,
    submitRole,
    submitUser,
    toggleDepartment,
    toggleRole,
    toggleUser,
    userDialogVisible,
    userForm,
    userRules,
    users
  };
}
