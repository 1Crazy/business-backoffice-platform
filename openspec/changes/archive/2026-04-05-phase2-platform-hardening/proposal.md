## Why

一期 MVP 已经完成主流程闭环并通过当前测试，但系统仍然建立在“单团队、低数据量、单机部署”的假设上。二期如果直接叠加企业微信、自动化营销或更复杂的运营分析，现有的列表查询、数据权限、会话治理、附件存储和交付流程会很快成为瓶颈，因此需要先完成一轮平台硬化。

## What Changes

- 将客户、线索和审计日志列表升级为支持分页、排序和统一筛选的查询接口与前端交互，避免全量加载成为默认路径。
- 将当前轻量的归属人访问逻辑升级为可配置的数据范围模型，覆盖本人、本部门、子部门和全部范围，并在业务列表、详情、提醒和看板统计中保持一致。
- 为后台认证补充会话治理能力，包括令牌续期、主动退出、账号停用后的令牌失效和失败登录审计。
- 将附件能力升级为可替换的存储抽象，保留本地文件存储作为默认实现，同时补充下载鉴权、文件约束和元数据管理。
- 统一看板指标与业务数据查询的统计口径，确保客户、线索、跟进和提醒都遵守同一套数据范围规则。
- 增加基础交付自动化，包括仓库级 CI 校验、关键脚本固化和二期变更的持续验证入口。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `access-control`: 扩展认证与授权要求，支持会话治理和更明确的数据范围控制。
- `customer-management`: 将客户列表与详情访问升级为分页查询并遵守统一数据范围规则。
- `lead-followup`: 将线索列表、提醒和转化上下文升级为分页查询并遵守统一数据范围规则。
- `operations-dashboard`: 调整看板指标定义，使其与统一数据范围和统计口径保持一致。
- `system-administration`: 扩展审计日志与附件管理要求，支持分页查询、下载鉴权和可替换存储后端。

## Impact

- Affected code:
  - `apps/api/src/modules/auth`, `apps/api/src/common/auth`, `apps/api/src/common/guards`
  - `apps/api/src/modules/customers`, `apps/api/src/modules/leads`, `apps/api/src/modules/dashboard`
  - `apps/api/src/modules/audit-logs`, `apps/api/src/modules/uploads`
  - `apps/api/prisma`
  - `apps/web/src/pages`, `apps/web/src/stores`, `apps/web/src/router`, `apps/web/src/api`
  - repository-level CI and developer scripts
- Affected APIs:
  - authentication profile/session APIs
  - customer, lead, reminder, audit-log list APIs
  - dashboard overview API
  - upload and attachment retrieval APIs
- Dependencies:
  - existing NestJS, Prisma, Vue and Element Plus stack
  - CI runner for lint/test/build validation
- Systems:
  - browser admin console
  - NestJS monolith API
  - PostgreSQL schema and migrations
  - local Docker workflow and repository delivery pipeline
