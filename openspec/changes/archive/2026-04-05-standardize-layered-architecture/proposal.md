## Why

当前仓库已经出现明显的结构债：前端多个页面文件超过 250 行，客户、线索、权限等页面同时承担接口请求、表单转换、提示反馈和局部状态编排；后端虽然 controller 边界基本清晰，但 service 普遍直接操作 Prisma、处理事务与异常并直接返回数据库实体。继续在这个基础上叠加业务，会让修改范围越来越大、阅读成本越来越高，也会让测试和代码评审越来越难落地。

## What Changes

- 新增一套面向仓库的 `codebase-architecture` 工程规范能力，统一约束前端页面、展示组件、接口访问层、类型声明、可复用逻辑与后端 controller/service/repository/dto/vo 的职责边界。
- 约束前端页面组件只负责组装页面，不直接承载复杂业务逻辑；所有接口请求下沉到 `api` 层；可复用逻辑沉到 `composables`；展示组件禁止直接请求接口。
- 明确前端目录约定：`apps/web/src/pages/<domain>/` 负责聚合同域页面入口、页面局部组件与同域测试文件，顶层 `api`、`types`、`composables` 保持分层语义但按业务域扩展。
- 统一 `apps/web/src` 内部导入风格，要求跨目录引用优先使用 `@/` 指向 `src` 根目录，而不是继续累积多层相对路径。
- 要求单个 Vue 单文件组件超过 250 行时必须继续拆分，并禁止在模板中书写复杂表达式、在单个方法中同时混合请求、数据转换、UI 提示和路由跳转。
- 要求后端 controller 仅负责路由和参数接收，service 负责业务编排，repository 负责数据库访问，DTO 仅负责入参校验与类型约束，VO/Response DTO 负责出参契约，禁止 controller 直接操作 ORM。
- 为跨模块依赖补充 module export/import 规则，并定义渐进式治理路径，优先拆分当前最重的前端页面和最复杂的后端 service。
- 为后续实现准备工程守卫，包括目录约定、命名约定、重构任务拆分以及代码评审检查点，确保新代码具备企业级可维护性，并避免仓库在后续迭代中回到“胖页面 / 胖 service”状态。

## Capabilities

### New Capabilities
- `codebase-architecture`: 定义前后端代码分层、文件拆分、依赖边界与返回契约的统一工程规范。

### Modified Capabilities

None.

## Impact

- Affected code:
  - `apps/web/src/pages`
  - `apps/web/src/components`
  - `apps/web/src/api`
  - `apps/web/src/composables`
  - `apps/web/src/types`
  - `apps/api/src/modules`
  - `apps/api/src/common`
- Affected APIs:
  - backend response construction for auth, customers, leads, departments, roles, dictionaries, uploads and audit logs
  - frontend data access call sites that currently invoke `http` directly from pages or presentational components
- Dependencies:
  - existing Vue 3, Element Plus, NestJS and Prisma stack
  - repository structure and module wiring conventions already used by the monorepo
- Systems:
  - browser admin console implementation structure
  - NestJS monolith service layering and database access path
  - engineering workflow for refactor planning, review and future feature delivery
