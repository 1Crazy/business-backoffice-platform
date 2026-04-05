## Why

当前仓库尚未形成可开发的 SCRM 系统骨架，但业务上已经明确需要一套可快速落地、可持续演进的客户运营后台。先定义一版聚焦销售与客户运营闭环的 MVP，可以帮助团队尽快统一范围、启动开发，并为后续企业微信、自动化营销等二期能力预留稳定扩展点。

## What Changes

- 新建一个基于 `Vue 3 + TypeScript` 的后台前端和一个基于 `NestJS` 的后端服务，并约定统一的本地开发结构。
- 引入基于 `PostgreSQL` 的核心业务数据模型，使用 Docker 启动本地数据库环境。
- 提供登录认证、角色权限、部门与员工管理等基础后台能力。
- 提供客户中心能力，包括客户档案、来源、标签、状态、归属人与列表筛选。
- 提供线索管理和跟进管理能力，包括线索分配、线索转客户、跟进记录与待办提醒。
- 提供基础运营看板，展示新增客户、跟进数量和线索转化率等 MVP 指标。
- 提供系统管理类基础能力，包括审计日志、字典配置和附件上传。

## Capabilities

### New Capabilities
- `access-control`: 提供账号登录、角色权限、菜单/API 授权，以及部门和员工管理能力。
- `customer-management`: 提供客户档案、标签、来源、状态、归属人与客户列表筛选能力。
- `lead-followup`: 提供线索录入、分配、转客户、跟进记录与待办提醒能力。
- `operations-dashboard`: 提供面向销售运营的基础指标看板与时间范围统计能力。
- `system-administration`: 提供审计日志、字典配置和业务附件上传等后台支撑能力。

### Modified Capabilities

None.

## Impact

- Affected code:
  - 新增 `Vue 3` 管理后台应用
  - 新增 `NestJS` API 服务
  - 新增数据库 schema、迁移与初始化配置
  - 新增 Docker 本地开发基础设施
- Affected APIs:
  - 登录认证、用户与角色、部门、客户、线索、跟进、看板、审计日志、字典和文件上传接口
- Dependencies:
  - `Vue 3`, `TypeScript`, `Vite`, `Pinia`, `Vue Router`, `Element Plus`
  - `NestJS`, `Prisma`, `PostgreSQL`, `Swagger`, `JWT`
  - `Docker Compose` for local PostgreSQL
- Systems:
  - 浏览器后台管理端
  - NestJS 单体 API 服务
  - PostgreSQL 本地开发数据库
