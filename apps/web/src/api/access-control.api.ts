/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type {
  CreateRolePayload,
  CreateUserPayload,
  Department,
  PermissionItem,
  Role,
  SaveDepartmentPayload,
  UpdateRolePayload,
  UpdateUserPayload,
  User
} from "@/types/access-control";

export async function fetchAccessControlData(): Promise<{
  departments: Department[];
  users: User[];
  roles: Role[];
  permissionCatalog: PermissionItem[];
}> {
  const [departmentResponse, userResponse, roleResponse, permissionResponse] = await Promise.all([
    http.get<Department[]>("/departments"),
    http.get<User[]>("/users"),
    http.get<Role[]>("/roles"),
    http.get<PermissionItem[]>("/roles/permissions/catalog")
  ]);

  return {
    departments: departmentResponse.data,
    users: userResponse.data,
    roles: roleResponse.data,
    permissionCatalog: permissionResponse.data
  };
}

export async function createDepartment(payload: SaveDepartmentPayload): Promise<void> {
  await http.post("/departments", payload);
}

export async function updateDepartment(departmentId: string, payload: SaveDepartmentPayload): Promise<void> {
  await http.patch(`/departments/${departmentId}`, payload);
}

export async function toggleDepartmentStatus(department: Department): Promise<void> {
  await http.patch(`/departments/${department.id}/${department.status === "ACTIVE" ? "disable" : "enable"}`);
}

export async function createUser(payload: CreateUserPayload): Promise<void> {
  await http.post("/users", payload);
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  await http.patch(`/users/${userId}`, payload);
}

export async function toggleUserStatus(user: User): Promise<void> {
  await http.patch(`/users/${user.id}/${user.status === "ACTIVE" ? "disable" : "enable"}`);
}

export async function createRole(payload: CreateRolePayload): Promise<void> {
  await http.post("/roles", payload);
}

export async function updateRole(roleId: string, payload: UpdateRolePayload): Promise<void> {
  await http.patch(`/roles/${roleId}`, payload);
}

export async function toggleRoleStatus(role: Role): Promise<void> {
  await http.patch(`/roles/${role.id}/${role.status === "ACTIVE" ? "disable" : "enable"}`);
}
