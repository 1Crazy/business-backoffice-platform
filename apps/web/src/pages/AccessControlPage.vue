<template>
  <div class="page-grid">
    <section class="summary-grid">
      <article class="page-card summary-card">
        <span>部门数</span>
        <strong>{{ departments.length }}</strong>
      </article>
      <article class="page-card summary-card">
        <span>员工数</span>
        <strong>{{ users.length }}</strong>
      </article>
      <article class="page-card summary-card">
        <span>角色数</span>
        <strong>{{ roles.length }}</strong>
      </article>
    </section>

    <section class="page-card">
      <el-tabs>
        <el-tab-pane label="部门管理">
        <div class="toolbar-row">
          <p>支持建立部门层级，为主管看板和数据权限预留团队视角。</p>
          <el-button type="primary" @click="openDepartmentDialog()">新增部门</el-button>
        </div>

          <div class="page-table-shell">
            <el-table :data="departments" border>
              <el-table-column prop="name" label="部门名称" min-width="160" />
              <el-table-column prop="code" label="编码" min-width="120" />
              <el-table-column label="上级部门" min-width="160">
                <template #default="{ row }">
                  {{ row.parent?.name ?? "-" }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column label="操作" width="220">
                <template #default="{ row }">
                  <el-button text @click="openDepartmentDialog(row)">编辑</el-button>
                  <el-button text @click="toggleDepartment(row)">{{ row.status === "ACTIVE" ? "停用" : "启用" }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="员工管理">
          <div class="toolbar-row">
            <p>员工账号与角色绑定后，会直接影响菜单可见性和接口授权范围。</p>
            <el-button type="primary" @click="openUserDialog()">新增员工</el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="users" border>
              <el-table-column prop="username" label="账号" min-width="140" />
              <el-table-column prop="displayName" label="姓名" min-width="140" />
              <el-table-column label="部门" min-width="160">
                <template #default="{ row }">
                  {{ row.department?.name ?? "-" }}
                </template>
              </el-table-column>
              <el-table-column label="角色" min-width="220">
                <template #default="{ row }">
                  <el-tag v-for="item in row.roles" :key="item.role.id" class="tag-item">
                    {{ item.role.name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column label="操作" width="220">
                <template #default="{ row }">
                  <el-button text @click="openUserDialog(row)">编辑</el-button>
                  <el-button text @click="toggleUser(row)">{{ row.status === "ACTIVE" ? "停用" : "启用" }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="角色权限">
          <div class="toolbar-row">
            <p>权限点采用扁平编码，方便前端菜单和后端接口共用一套控制口径。</p>
            <el-button type="primary" @click="openRoleDialog()">新增角色</el-button>
          </div>

          <div class="page-table-shell">
            <el-table :data="roles" border>
              <el-table-column prop="name" label="角色名称" min-width="160" />
              <el-table-column prop="code" label="编码" min-width="140" />
              <el-table-column label="权限" min-width="260">
                <template #default="{ row }">
                  <el-tag v-if="row.permissions.length === 0" class="tag-item" type="warning">
                    未分配权限
                  </el-tag>
                  <el-tag
                    v-for="item in row.permissions"
                    :key="item.permission.id"
                    class="tag-item"
                    type="info"
                  >
                    {{ item.permission.name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column label="操作" width="220">
                <template #default="{ row }">
                  <el-button text @click="openRoleDialog(row)">编辑</el-button>
                  <el-button text @click="toggleRole(row)">{{ row.status === "ACTIVE" ? "停用" : "启用" }}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog
      v-model="departmentDialogVisible"
      :title="departmentForm.id ? '编辑部门' : '新增部门'"
      width="520px"
      class="entity-dialog"
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        :rules="departmentRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-form-item label="部门名称" prop="name" required>
          <el-input v-model="departmentForm.name" placeholder="请输入部门名称" maxlength="24" />
        </el-form-item>
        <el-form-item label="编码" prop="code" required>
          <el-input
            v-model="departmentForm.code"
            placeholder="请输入唯一编码，例如 SALES-NORTH"
            maxlength="32"
          />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-select v-model="departmentForm.parentId" clearable class="full-width" placeholder="不选则创建一级部门">
            <el-option
              v-for="item in departments.filter((department) => department.id !== departmentForm.id)"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="departmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDepartment">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="userDialogVisible"
      :title="userForm.id ? '编辑员工' : '新增员工'"
      width="640px"
      class="entity-dialog"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="账号" prop="username" required>
              <el-input
                v-model="userForm.username"
                :disabled="Boolean(userForm.id)"
                placeholder="请输入登录账号"
                maxlength="24"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="姓名" prop="displayName" required>
              <el-input v-model="userForm.displayName" placeholder="请输入员工姓名" maxlength="24" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="密码" prop="password" :required="!userForm.id">
              <el-input
                v-model="userForm.password"
                type="password"
                show-password
                :placeholder="userForm.id ? '留空则保持原密码' : '请输入至少 8 位密码'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="部门" prop="departmentId" required>
              <el-select v-model="userForm.departmentId" clearable class="full-width" placeholder="请选择所属部门">
                <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="选填，示例：ops@example.com" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="userForm.phone" placeholder="选填，便于后续联系" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色" prop="roleIds" required>
          <el-select v-model="userForm.roleIds" class="full-width" multiple placeholder="请至少选择一个角色">
            <el-option v-for="item in roles" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
          <div class="field-hint">至少一个角色需要具备页面权限，否则账号登录后只能进入无权限说明页。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="roleDialogVisible"
      :title="roleForm.id ? '编辑角色' : '新增角色'"
      width="720px"
      class="entity-dialog"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="角色名称" prop="name" required>
              <el-input v-model="roleForm.name" placeholder="请输入角色名称" maxlength="24" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="编码" prop="code" required>
              <el-input
                v-model="roleForm.code"
                :disabled="Boolean(roleForm.id)"
                placeholder="请输入唯一编码，例如 sales-manager"
                maxlength="32"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" placeholder="选填，描述该角色的职责边界" />
        </el-form-item>
        <el-form-item label="权限" prop="permissionIds" required>
          <el-checkbox-group v-model="roleForm.permissionIds" class="permission-grid">
            <el-checkbox v-for="item in permissionCatalog" :key="item.id" :value="item.id">
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
          <div class="field-hint">未勾选任何权限的角色无法访问后台页面，绑定后只会进入无权限说明页。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { nextTick, onMounted, reactive, ref } from "vue";

import { http } from "../api/http";
import type { Department, PermissionItem, Role, User } from "../types/entities";
import {
  normalizeOptionalTextForCreate,
  normalizeOptionalTextForUpdate,
  normalizeRequiredText,
  normalizeStringList
} from "../utils/form";

const departments = ref<Department[]>([]);
const users = ref<User[]>([]);
const roles = ref<Role[]>([]);
const permissionCatalog = ref<PermissionItem[]>([]);

const departmentDialogVisible = ref(false);
const userDialogVisible = ref(false);
const roleDialogVisible = ref(false);
const departmentFormRef = ref<FormInstance>();
const userFormRef = ref<FormInstance>();
const roleFormRef = ref<FormInstance>();

const departmentForm = reactive({
  id: "",
  name: "",
  code: "",
  parentId: null as string | null
});

const userForm = reactive({
  id: "",
  username: "",
  displayName: "",
  password: "",
  email: "",
  phone: "",
  departmentId: null as string | null,
  roleIds: [] as string[]
});

const roleForm = reactive({
  id: "",
  name: "",
  code: "",
  description: "",
  permissionIds: [] as string[]
});

const departmentRules: FormRules<typeof departmentForm> = {
  name: [
    { required: true, message: "请输入部门名称", trigger: "blur" },
    { min: 2, message: "部门名称至少需要 2 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入部门编码", trigger: "blur" },
    { min: 2, message: "部门编码至少需要 2 个字符", trigger: "blur" }
  ]
};

const userRules: FormRules<typeof userForm> = {
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

const roleRules: FormRules<typeof roleForm> = {
  name: [
    { required: true, message: "请输入角色名称", trigger: "blur" },
    { min: 2, message: "角色名称至少需要 2 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入角色编码", trigger: "blur" },
    { min: 2, message: "角色编码至少需要 2 个字符", trigger: "blur" }
  ],
  permissionIds: [
    { type: "array", required: true, min: 1, message: "请至少勾选一个权限点", trigger: "change" }
  ]
};

function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(message) && message.length) {
    return message[0];
  }

  if (typeof message === "string") {
    return message;
  }

  return fallback;
}

async function validateForm(form: FormInstance | undefined): Promise<boolean> {
  if (!form) {
    return true;
  }

  try {
    await form.validate();
    return true;
  } catch {
    return false;
  }
}

async function loadData(): Promise<void> {
  try {
    const [departmentResponse, userResponse, roleResponse, permissionResponse] = await Promise.all([
      http.get<Department[]>("/departments"),
      http.get<User[]>("/users"),
      http.get<Role[]>("/roles"),
      http.get<PermissionItem[]>("/roles/permissions/catalog")
    ]);

    departments.value = departmentResponse.data;
    users.value = userResponse.data;
    roles.value = roleResponse.data;
    permissionCatalog.value = permissionResponse.data;
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "权限与组织数据加载失败，请稍后重试。"));
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

  if (departmentForm.id && departmentForm.parentId === departmentForm.id) {
    ElMessage.error("上级部门不能选择自己。");
    return;
  }

  const createPayload = {
    name: normalizeRequiredText(departmentForm.name),
    code: normalizeRequiredText(departmentForm.code),
    parentId: normalizeOptionalTextForCreate(departmentForm.parentId)
  };
  const updatePayload = {
    name: normalizeRequiredText(departmentForm.name),
    code: normalizeRequiredText(departmentForm.code),
    parentId: normalizeOptionalTextForUpdate(departmentForm.parentId)
  };

  try {
    if (departmentForm.id) {
      await http.patch(`/departments/${departmentForm.id}`, updatePayload);
    } else {
      await http.post("/departments", createPayload);
    }

    departmentDialogVisible.value = false;
    ElMessage.success("部门已保存。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "部门保存失败，请检查表单后重试。"));
  }
}

async function toggleDepartment(department: Department): Promise<void> {
  try {
    await http.patch(`/departments/${department.id}/${department.status === "ACTIVE" ? "disable" : "enable"}`);
    ElMessage.success("部门状态已更新。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "部门状态更新失败，请稍后重试。"));
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

  const createPayload = {
    username: normalizeRequiredText(userForm.username),
    displayName: normalizeRequiredText(userForm.displayName),
    password: normalizeRequiredText(userForm.password),
    email: normalizeOptionalTextForCreate(userForm.email),
    phone: normalizeOptionalTextForCreate(userForm.phone),
    departmentId: normalizeOptionalTextForCreate(userForm.departmentId),
    roleIds: normalizeStringList(userForm.roleIds)
  };
  const updatePayload = {
    displayName: normalizeRequiredText(userForm.displayName),
    password: normalizeOptionalTextForCreate(userForm.password),
    email: normalizeOptionalTextForUpdate(userForm.email),
    phone: normalizeOptionalTextForUpdate(userForm.phone),
    departmentId: normalizeOptionalTextForUpdate(userForm.departmentId),
    roleIds: normalizeStringList(userForm.roleIds)
  };

  try {
    if (userForm.id) {
      await http.patch(`/users/${userForm.id}`, updatePayload);
    } else {
      await http.post("/users", createPayload);
    }

    userDialogVisible.value = false;
    ElMessage.success("员工已保存。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "员工保存失败，请检查表单后重试。"));
  }
}

async function toggleUser(user: User): Promise<void> {
  try {
    await http.patch(`/users/${user.id}/${user.status === "ACTIVE" ? "disable" : "enable"}`);
    ElMessage.success("员工状态已更新。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "员工状态更新失败，请稍后重试。"));
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

  const createPayload = {
    name: normalizeRequiredText(roleForm.name),
    code: normalizeRequiredText(roleForm.code),
    description: normalizeOptionalTextForCreate(roleForm.description),
    permissionIds: normalizeStringList(roleForm.permissionIds)
  };
  const updatePayload = {
    name: normalizeRequiredText(roleForm.name),
    description: normalizeOptionalTextForUpdate(roleForm.description),
    permissionIds: normalizeStringList(roleForm.permissionIds)
  };

  try {
    if (roleForm.id) {
      await http.patch(`/roles/${roleForm.id}`, updatePayload);
    } else {
      await http.post("/roles", createPayload);
    }

    roleDialogVisible.value = false;
    ElMessage.success("角色已保存。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "角色保存失败，请检查表单后重试。"));
  }
}

async function toggleRole(role: Role): Promise<void> {
  try {
    await http.patch(`/roles/${role.id}/${role.status === "ACTIVE" ? "disable" : "enable"}`);
    ElMessage.success("角色状态已更新。");
    await loadData();
  } catch (error) {
    ElMessage.error(getErrorMessage(error, "角色状态更新失败，请稍后重试。"));
  }
}

onMounted(() => {
  void loadData();
});
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.summary-card {
  display: grid;
  gap: 10px;
}

.summary-card span {
  color: #64748b;
}

.summary-card strong {
  font-size: 30px;
  color: #0f172a;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-row p {
  margin: 0;
  color: #64748b;
}

.field-hint {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 16px;
}

.dialog-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.dialog-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #334155;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select),
.dialog-form :deep(.el-textarea),
.dialog-form :deep(.el-date-editor),
.dialog-form :deep(.el-checkbox-group) {
  width: 100%;
}

.dialog-form :deep(.el-checkbox) {
  margin-right: 0;
}

.entity-dialog :deep(.el-dialog) {
  max-width: calc(100vw - 32px);
}

.entity-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}

.full-width {
  width: 100%;
}

:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}

@media (max-width: 960px) {
  .summary-grid,
  .permission-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
