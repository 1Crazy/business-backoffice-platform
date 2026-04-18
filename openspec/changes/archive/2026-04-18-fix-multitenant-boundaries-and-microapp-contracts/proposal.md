## Why

当前多租户改造只在部分链路落地，OA、流程引擎、开放平台更新链路和宿主/子应用路由契约仍存在“模型已支持、实现未收口”的缺口。这些缺口会导致跨租户审批人选取、跨租户流程读写、宿主菜单与子应用权限不一致，以及会话失效时微前端跳转到错误登录路径。

## What Changes

- 修复 OA 工作台、请假/行政申请、公告和通讯录链路的租户上下文绑定，确保创建、查询、审批和统计全部按当前租户收口。
- 修复流程模板、流程实例、待办任务、审批人解析与抄送链路的租户边界，使工作流仓储和服务层不再依赖隐式上层过滤。
- 收紧开放平台更新链路的仓储契约，确保租户级凭证、Webhook 和身份连接器更新在仓储层也具备显式租户约束。
- 对齐主应用导航与 OA 子应用页面权限契约，并统一微前端模式下的登录失效跳转行为。
- 收紧系统治理接口边界，避免租户级系统管理入口暴露平台级通知、存储和调度治理能力。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tenant-isolation-foundation`: 补充 OA、流程引擎和开放平台更新链路必须在仓储层强制应用租户边界。
- `office-automation-workspace`: 要求 OA 的申请、审批、公告和通讯录查询全部限定在当前租户上下文内。
- `configurable-workflow-engine`: 要求流程模板、实例、任务和审批人解析按租户范围运行，而不是在全局空间读写。
- `backoffice-super-app-shell`: 要求宿主导航权限、子应用页面权限和登录失效跳转在宿主/子应用模式下保持一致。
- `access-control`: 要求宿主壳层使用与子应用一致的页面权限契约，不得因为权限键漂移导致菜单与页面行为不一致。
- `system-administration`: 明确租户级系统管理不得直接暴露平台级通知、存储和调度治理入口。

## Impact

- Affected code:
  - `apps/api/src/modules/office-automation/**`
  - `apps/api/src/modules/workflow/**`
  - `apps/api/src/modules/open-integration/**`
  - `apps/api/src/modules/system-governance/**`
  - `apps/main-web/src/**`
  - `apps/oa-web/src/**`
  - `apps/scrm-web/src/**`
- Affected APIs:
  - `/api/oa/**`
  - `/api/workflows/**`
  - `/api/open-integration/**`
  - `/api/system-governance/**`
- Affected systems:
  - main host shell
  - `oa-web`
  - `scrm-web`
  - multi-tenant access control and workflow runtime
