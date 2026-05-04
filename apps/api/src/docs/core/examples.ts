import type { OpenAPIObject } from "@nestjs/swagger";

import {
  applyStandardErrorExample,
  getOperation,
  getSchemaExample,
  setJsonErrorExample,
  setJsonRequestExample,
  setJsonSuccessExample
} from "../shared/openapi-helpers";

function applyCoreSchemaExamples(document: OpenAPIObject): void {
  const schemas = document.components?.schemas as Record<string, any> | undefined;

  if (schemas?.ApiErrorResponseVo) {
    schemas.ApiErrorResponseVo.example = {
      statusCode: 403,
      message: "当前账号没有执行该操作的权限。",
      error: "ForbiddenException",
      path: "/api/customers",
      timestamp: "2026-05-04T11:13:42.000Z"
    };
  }

  if (schemas?.LoginDto) {
    schemas.LoginDto.example = {
      username: "demo_admin",
      password: "StrongPass!2026"
    };
  }

  if (schemas?.VerifyLoginMfaDto) {
    schemas.VerifyLoginMfaDto.example = {
      ticket: "mfa-ticket-7d3c1f",
      code: "123456"
    };
  }

  if (schemas?.CurrentUserVo) {
    schemas.CurrentUserVo.example = {
      id: "user_001",
      tenantId: "tenant_001",
      tenantCode: "acme-cn",
      username: "demo_admin",
      displayName: "演示管理员",
      departmentId: "dept_sales",
      roleCodes: ["tenant_admin"],
      permissions: ["customer:read", "customer:write", "lead:read", "opportunity:read"],
      dataScopes: ["ALL"]
    };
  }

  if (schemas?.LoginResponseVo) {
    schemas.LoginResponseVo.example = {
      success: true,
      mfaRequired: false,
      mfaTicket: null,
      mfaChallengeType: null,
      sessionExpiresAt: "2026-05-04T20:00:00.000Z",
      user: schemas.CurrentUserVo?.example
    };
  }
}

export function applyCoreOpenApiExamples(document: OpenAPIObject): void {
  applyCoreSchemaExamples(document);

  const loginOperation = getOperation(document, "/api/auth/login", "post");
  const verifyMfaOperation = getOperation(document, "/api/auth/mfa/login/verify", "post");
  const profileOperation = getOperation(document, "/api/auth/profile", "get");
  const usersListOperation = getOperation(document, "/api/users", "get");
  const usersCreateOperation = getOperation(document, "/api/users", "post");
  const userUpdateOperation = getOperation(document, "/api/users/{id}", "patch");
  const userEnableOperation = getOperation(document, "/api/users/{id}/enable", "patch");
  const userDisableOperation = getOperation(document, "/api/users/{id}/disable", "patch");
  const rolesListOperation = getOperation(document, "/api/roles", "get");
  const rolesCreateOperation = getOperation(document, "/api/roles", "post");
  const roleUpdateOperation = getOperation(document, "/api/roles/{id}", "patch");
  const rolePermissionCatalogOperation = getOperation(document, "/api/roles/permissions/catalog", "get");
  const departmentsListOperation = getOperation(document, "/api/departments", "get");
  const departmentsCreateOperation = getOperation(document, "/api/departments", "post");
  const departmentUpdateOperation = getOperation(document, "/api/departments/{id}", "patch");

  setJsonRequestExample(loginOperation, "标准账号密码登录", {
    username: "demo_admin",
    password: "StrongPass!2026"
  });
  setJsonSuccessExample(loginOperation, "登录成功", getSchemaExample(document, "LoginResponseVo"));
  setJsonErrorExample(loginOperation, 403, "账号受限", {
    statusCode: 403,
    message: "当前账号没有执行该操作的权限。",
    error: "ForbiddenException",
    path: "/api/auth/login",
    timestamp: "2026-05-04T11:13:42.000Z"
  });
  applyStandardErrorExample(loginOperation, 400, "/api/auth/login", "登录参数不合法");

  setJsonRequestExample(verifyMfaOperation, "MFA 挑战验证", {
    ticket: "mfa-ticket-7d3c1f",
    code: "123456"
  });
  applyStandardErrorExample(verifyMfaOperation, 400, "/api/auth/mfa/login/verify", "挑战参数不合法");
  applyStandardErrorExample(verifyMfaOperation, 403, "/api/auth/mfa/login/verify", "动态验证码错误");

  setJsonSuccessExample(profileOperation, "当前登录用户资料", getSchemaExample(document, "CurrentUserVo"));
  applyStandardErrorExample(profileOperation, 401, "/api/auth/profile", "当前请求没有有效登录身份");

  setJsonSuccessExample(usersListOperation, "员工列表示例", [
    {
      id: "user_001",
      username: "demo_admin",
      displayName: "演示管理员",
      email: "admin@example.com",
      phone: "13800000000",
      status: "ACTIVE",
      departmentId: "dept_sales",
      department: {
        id: "dept_sales",
        name: "销售部",
        code: "SALES",
        status: "ACTIVE",
        parentId: null
      },
      roles: [
        {
          role: {
            id: "role_admin",
            name: "租户管理员",
            code: "tenant_admin",
            description: "拥有全部后台权限",
            isSystem: true,
            status: "ACTIVE",
            dataScope: "ALL",
            permissions: [],
            extendedDataScopes: [],
            fieldPermissionRules: [],
            actionPermissionRules: [],
            createdAt: "2026-05-01T09:00:00.000Z",
            updatedAt: "2026-05-03T09:00:00.000Z"
          }
        }
      ],
      createdAt: "2026-05-01T09:00:00.000Z",
      lockedAt: null,
      securityLockStatus: "NONE",
      securityLockReason: null,
      securityLockReviewedAt: null,
      updatedAt: "2026-05-03T09:00:00.000Z"
    }
  ]);
  setJsonRequestExample(usersCreateOperation, "创建员工请求", {
    username: "sales_a",
    displayName: "销售顾问A",
    password: "StrongPass!2026",
    email: "sales.a@example.com",
    phone: "13900000000",
    departmentId: "dept_sales",
    roleIds: ["role_sales"]
  });
  setJsonRequestExample(userUpdateOperation, "更新员工请求", {
    displayName: "销售顾问A-华东",
    email: "sales.a-east@example.com",
    phone: "13900001111",
    departmentId: "dept_east_sales",
    roleIds: ["role_sales", "role_pipeline_viewer"]
  });
  applyStandardErrorExample(userEnableOperation, 403, "/api/users/{id}/enable", "当前账号没有员工启用权限");
  applyStandardErrorExample(userEnableOperation, 404, "/api/users/{id}/enable", "未找到指定员工");
  applyStandardErrorExample(userDisableOperation, 403, "/api/users/{id}/disable", "当前账号没有员工停用权限");
  applyStandardErrorExample(userDisableOperation, 404, "/api/users/{id}/disable", "未找到指定员工");

  setJsonSuccessExample(rolesListOperation, "角色列表示例", [
    {
      id: "role_sales",
      name: "销售顾问",
      code: "sales_consultant",
      description: "负责线索、客户和商机跟进",
      isSystem: false,
      status: "ACTIVE",
      dataScope: "SELF",
      permissions: [],
      extendedDataScopes: [],
      fieldPermissionRules: [],
      actionPermissionRules: [],
      createdAt: "2026-05-01T09:00:00.000Z",
      updatedAt: "2026-05-03T09:00:00.000Z"
    }
  ]);
  setJsonSuccessExample(rolePermissionCatalogOperation, "权限目录示例", [
    {
      id: "perm_customer_read",
      appCode: "scrm",
      name: "查看客户",
      code: "customer:read",
      description: "允许查看客户列表与详情",
      group: "customer",
      createdAt: "2026-05-01T09:00:00.000Z",
      updatedAt: "2026-05-01T09:00:00.000Z"
    }
  ]);
  setJsonRequestExample(rolesCreateOperation, "创建角色请求", {
    name: "销售顾问",
    code: "sales_consultant",
    description: "负责线索、客户和商机跟进",
    isSystem: false,
    dataScope: "SELF",
    permissionIds: ["perm_customer_read", "perm_lead_read", "perm_opportunity_write"]
  });
  setJsonRequestExample(roleUpdateOperation, "更新角色请求", {
    name: "销售顾问-华东",
    description: "负责华东区域客户跟进",
    dataScope: "DEPARTMENT",
    permissionIds: ["perm_customer_read", "perm_lead_read", "perm_opportunity_write"]
  });

  setJsonSuccessExample(departmentsListOperation, "部门列表示例", [
    {
      id: "dept_sales",
      name: "销售部",
      code: "SALES",
      status: "ACTIVE",
      parentId: null,
      parent: null,
      createdAt: "2026-05-01T09:00:00.000Z",
      updatedAt: "2026-05-03T09:00:00.000Z"
    }
  ]);
  setJsonRequestExample(departmentsCreateOperation, "创建部门请求", {
    name: "华东销售部",
    code: "EAST_SALES",
    parentId: "dept_sales"
  });
  setJsonRequestExample(departmentUpdateOperation, "更新部门请求", {
    name: "华东销售一部",
    code: "EAST_SALES_1",
    parentId: "dept_sales"
  });
}
