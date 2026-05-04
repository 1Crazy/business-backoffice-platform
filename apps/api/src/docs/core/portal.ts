import type { TagMetadata } from "../shared/portal-types";

export const CORE_TAG_METADATA: TagMetadata[] = [
  {
    key: "auth",
    name: "认证与会话",
    description:
      "先看登录、MFA、profile 和 refresh。前端初始化权限上下文时必须依赖这里的返回结构。典型联调链路：`/api/auth/login` -> `/api/auth/mfa/login/verify` -> `/api/auth/profile`。常见问题是 Cookie 未建立或令牌已失效。"
  },
  {
    key: "users",
    name: "用户管理",
    description: "用于查询和维护企业成员资料。通常在做组织、权限或后台管理页面时再进入这里。常见限制是需要管理员权限。"
  },
  {
    key: "roles",
    name: "角色与权限",
    description: "用于理解角色、权限和数据范围模型。当前端要解释为什么某些列表为空或按钮不可点时，应先回看这里。"
  },
  {
    key: "departments",
    name: "部门组织",
    description: "组织架构、部门树与人员归属关系。组织筛选或部门树页面通常先看这里。"
  }
];
