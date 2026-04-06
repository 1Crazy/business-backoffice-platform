# 开发与验证说明

本文档补充二期平台硬化后的开发约定，重点覆盖会话治理、分页接口、附件限制和本地验证流程。

## 架构与维护约定

所有新代码都必须以企业级可维护性为目标，而不是只满足“功能可用”。这里的企业级可维护性至少包括：职责边界清晰、命名稳定、契约明确、低耦合、可测试、可渐进重构，以及关键逻辑具备清晰、准确、对维护者有价值的注释。

### 前端分层

- 前端工作区统一采用 `apps/<domain>-web` 命名；当前已落地 `apps/scrm-web` 与 `apps/oa-web`，未来新增其他后台前端也遵循相同规则。
- 页面组件只负责页面组装、路由上下文和顶层交互编排，不直接承载复杂业务流程。
- 所有接口请求统一放到应用内的 `apps/<domain>-web/src/api` 领域模块中；页面、布局和展示组件不得直接导入 `api/http`。
- 所有可复用逻辑统一放到应用内的 `apps/<domain>-web/src/composables`，优先按业务场景命名，例如 `useCustomersList`、`useLeadFollowUps`。
- 所有类型声明统一放到应用内的 `apps/<domain>-web/src/types` 领域文件中，禁止继续向单一“大而全”的类型文件无节制追加内容。
- 展示组件只通过 `props` 和 `emits` 协作，不直接请求接口。
- 单个 Vue 文件超过 `250` 行必须继续拆分；拆分优先级依次为：section/dialog/drawer 子组件、composable、领域 API。
- 禁止在模板里写复杂表达式；复杂筛选、映射、格式化和条件分支必须下沉到 `computed`、辅助函数或显式 props。
- 禁止在一个方法里同时处理请求、数据转换、UI 提示和路由跳转；至少拆分为 mapper、action/composable 和页面反馈协作。
- 全局挂载的 UI 组件库必须在应用入口统一配置与后台界面一致的 locale；当前仓库默认中文，禁止让 Element Plus 的分页、表格空态、日期面板等共享默认文案回退为英文。
- 关键业务规则、边界条件、临时兼容方案和非直观实现必须补充中文注释；注释要解释“为什么”，不要重复“代码在做什么”。

### 后端分层

- `Controller` 只做路由、参数接收、鉴权注解和 service 调用，不写业务细节，不直接操作 ORM。
- `Service` 只做业务编排、事务边界和跨模块协作，不直接暴露 HTTP 细节。
- `Repository` 专门负责数据库访问；除了 `repository` 和少量已登记遗留例外，其他位置不得直接使用 `PrismaService`。
- `apps/api/src` 内部跨目录依赖统一使用 `@/` 根别名；同目录或单层近邻引用可以保留 `./` / `../`，但两层及以上目录回退必须改为 alias。
- `DTO` 只负责入参校验和类型约束。
- `VO` / `Response DTO` 负责对外返回契约，接口禁止直接暴露 Entity 或 Prisma 查询结果。
- 所有跨模块依赖必须通过 module `exports` / `imports` 管理，禁止直接引用其他模块的内部实现。
- 复杂事务、权限边界、数据映射和遗留兼容逻辑必须写清楚中文注释，便于后续审计和重构。
- Swagger 的 `controller`、`DTO`、`VO/Response DTO` 必须补充中文摘要或字段说明，让接口使用者无需回到源码猜测业务语义。

### 命名约定

- 前端领域 API 文件命名使用 `<domain>.api.ts`。
- 前端 composable 使用 `use<Domain><Scenario>.ts`。
- 前端展示组件优先使用 `<Domain><Purpose>Section.vue`、`<Domain><Purpose>Dialog.vue`、`<Domain><Purpose>Drawer.vue`。
- 后端 repository 使用 `<Module>Repository`，返回对象使用 `<Module><Purpose>Vo` 或 `<Module><Purpose>ResponseDto`，同一模块内术语保持统一。

### Review Checklist

- 这次改动是否让页面只负责组装，而不是继续堆业务逻辑。
- 是否把请求、表单归一化和复用状态放到了 `api` / `composables` / `types`。
- 模板里是否仍然存在难读的复杂表达式。
- 是否有单个方法同时处理请求、转换、提示和跳转。
- 是否有展示组件直接请求接口。
- Element Plus 等共享组件的默认分页、表格空态、日期面板文案是否仍保持中文，而不是回退成英文 fallback。
- controller 是否仍然保持 transport-only 边界。
- service 是否仍然直接依赖 Prisma，而本次又没有同步收敛到 repository。
- 后端是否又引入了两层及以上的相对路径回退，而没有改成 `@/` 根别名。
- 返回对象是否已经是显式契约，而不是数据库实体泄漏。
- 新增命名是否遵守仓库既有约定，而不是出现新的平行术语。
- 新增或修改的复杂逻辑是否补了有信息量的中文注释，特别是业务规则、边界条件、兼容处理和遗留例外。
- Swagger 的接口摘要、请求字段和返回字段是否已经补齐必要的中文说明。
- 测试是否覆盖了新的职责边界或至少没有把可测试逻辑重新塞回页面/胖 service。

### 架构校验与遗留例外

- 执行 `pnpm architecture:check` 可以运行仓库级架构校验。
- 当前已知遗留例外集中记录在 `scripts/architecture-check-baseline.json`。
- 新增遗留例外前必须先完成代码评审，并同步更新 OpenSpec 变更说明；默认只允许减少例外，不允许无说明扩张。
- 当前脚本主要覆盖可静态检测的规则；中文注释质量、Swagger 说明完整度、模板复杂度和单方法职责边界仍需结合上面的 review checklist 人工确认。
- 仓库脚本必须清晰区分“基础设施容器”“本地热更新开发”“全量 Docker 联调”三类入口，避免开发者为日常改代码反复重建前后端镜像。

## 环境变量

根目录 `.env` 用于 `docker-compose.yml`：

- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_PORT`
- `JWT_SECRET`

后端 `apps/api/.env`：

- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`

前端 `apps/scrm-web/.env` 与 `apps/oa-web/.env`：

- `VITE_API_BASE_URL`

## 会话治理

- 访问令牌由后端 JWT 模块签发，当前固定有效期为 `12h`。
- 刷新令牌通过 `UserSession` 持久化管理，当前固定有效期为 `30d`。
- 登录成功后返回 `accessToken`、`refreshToken`、`sessionExpiresAt` 和当前用户资料。
- `POST /api/auth/refresh` 使用刷新令牌续期访问令牌。
- `POST /api/auth/logout` 只撤销当前会话；会话撤销或账号停用后，请求会在下一次受保护访问时失效。

## 分页与数据范围

以下列表接口已统一返回分页结构：

- `GET /api/customers`
- `GET /api/leads`
- `GET /api/leads/reminders`
- `GET /api/audit-logs`

统一返回结构：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

业务列表、详情、提醒和看板统计都共享角色数据范围：

- `SELF`：仅本人数据
- `DEPARTMENT`：本人所在部门
- `DEPARTMENT_AND_SUBTREE`：部门及下级部门
- `ALL`：全部数据

## 附件约束

- 默认存储驱动：本地磁盘 `uploads/`
- 默认存储提供方：`LOCAL`
- 上传大小上限：`10 MB`
- 当前允许的 MIME 类型：
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `text/plain`
  - `text/csv`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-excel`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 下载入口：`GET /api/uploads/:id/download`
- 下载除了数据范围校验外，还要求具备对应业务读取权限：
  - 客户附件需要 `customer:read`
  - 线索附件需要 `lead:read`

## 本地开发

安装依赖：

```bash
pnpm install
```

初始化 Prisma：

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

推荐日常开发流程：

```bash
pnpm docker:infra
pnpm dev:full
```

说明：

- `pnpm docker:infra` 只启动 PostgreSQL，适合本地热更新开发前的基础设施准备。
- `pnpm dev:full` 会并行启动本地 API 与 Web，适合作为默认日常开发入口。
- 如果只改某个前端，可以保留数据库容器，仅执行 `pnpm dev:scrm-web` 或 `pnpm dev:oa-web`。
- `pnpm docker:up` 仍保留给全量联调、验收和近部署环境验证，不建议作为每次改代码后的默认入口。

分别启动单个服务：

```bash
pnpm dev:api
pnpm dev:scrm-web
pnpm dev:oa-web
```

查看或停止开发用数据库：

```bash
pnpm docker:infra:logs
pnpm docker:infra:down
```

需要全量 Docker 联调时，再执行：

```bash
pnpm docker:up
```

## 验证清单

建议至少执行一次完整校验：

```bash
pnpm prisma:generate
pnpm architecture:check
pnpm lint
pnpm test
pnpm build
```

需要做全链路联调时，再补一轮：

```bash
pnpm prisma:migrate
pnpm prisma:seed
pnpm docker:up
curl -s http://localhost:3000/api/health
```

关键角色权限场景建议覆盖：

- 超级管理员可以查看全部客户、线索、提醒、审计日志和附件下载。
- 销售主管仅查看本部门范围内的客户、线索、提醒和看板统计。
- 销售成员仅查看本人归属数据，且无法访问超出范围的详情、转化和附件下载。
- 会话在执行退出后无法继续刷新；停用账号的活动会话会在下一次访问受保护接口时失效。
- 新增或重构代码必须通过 `pnpm architecture:check`，且不允许无说明地新增遗留架构例外。
