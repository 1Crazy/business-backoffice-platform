import type { SchemaDescriptionModule } from "../shared/schema-descriptions";

export const CORE_SCHEMA_DESCRIPTIONS: SchemaDescriptionModule = {
  schemaDescriptions: {
    LoginDto: "账号密码登录的请求参数。",
    LoginResponseVo: "登录或刷新令牌后的统一响应结构。",
    CurrentUserVo: "当前登录账号的资料与权限摘要。",
    LogoutResponseVo: "退出登录后的返回结果。",
    MfaSetupVo: "多因素认证配置结果与恢复码信息。",
    MfaStatusVo: "多因素认证启用状态。",
    PasswordResetRequestVo: "重置密码操作结果。",
    PasswordResetTokenVo: "密码重置申请结果。"
  },
  propertyDescriptions: {
    "LoginResponseVo.user": "当前登录用户资料；仅在登录成功后返回。",
    "LoginResponseVo.sessionExpiresAt": "当前访问令牌对应会话的过期时间。",
    "CurrentUserVo.roleCodes": "当前用户角色编码列表。",
    "CurrentUserVo.permissions": "当前用户权限编码列表。",
    "CurrentUserVo.dataScopes":
      "当前用户的数据范围编码列表。SELF=仅本人；DEPARTMENT=本部门；DEPARTMENT_AND_SUBTREE=本部门及下级部门；ALL=全部数据。",
    "CurrentUserVo.id": "当前登录员工 ID，用于权限判定、数据范围计算和审计归属。",
    "CurrentUserVo.tenantId": "当前登录员工所属租户 ID，用于标识本次访问生效的租户上下文。",
    "CurrentUserVo.tenantCode": "当前登录账号所属租户编码，便于与外部系统或多租户路由规则对照。",
    "CurrentUserVo.departmentId": "当前登录员工所属部门 ID；为空时表示未绑定部门组织。",
    "LogoutResponseVo.success": "是否已成功退出当前会话。",
    "PasswordResetRequestVo.success": "是否已成功完成密码重置。",
    "PasswordResetTokenVo.success": "是否已成功受理密码重置申请。",
    "MfaSetupVo.enabled": "当前账号是否已启用 MFA。",
    "MfaSetupVo.challenge": "MFA 绑定挑战信息或二维码种子。",
    "MfaSetupVo.recoveryCodes": "首次配置后返回的一次性恢复码列表。",
    "UserSessionVo.id": "登录会话 ID，用于会话查询、审计追踪和管理员撤销。",
    "UserSessionVo.userId": "该会话归属的员工 ID，用于标识实际登录主体。",
    "UserVo.id": "员工 ID。",
    "UserSummaryVo.id": "员工 ID。",
    "UserVo.departmentId": "员工所属部门 ID。",
    "RoleVo.id": "角色 ID。",
    "DepartmentVo.id": "部门 ID。",
    "DepartmentVo.parentId": "上级部门 ID。"
  },
  enumDescriptions: {
    DataScope: {
      SELF: "仅本人可见。",
      DEPARTMENT: "本人所在部门范围可见。",
      DEPARTMENT_AND_SUBTREE: "本人部门及下级部门范围可见。",
      ALL: "全量数据可见。"
    }
  }
};
