# 多应用多租户业务后台平台

这是一个基于 `pnpm workspace` 的多应用业务后台仓库，当前采用 `Vue 3 + TypeScript` 前端、`NestJS + Prisma` 后端、`PostgreSQL` 数据库，并通过 `qiankun` 承载统一主应用与业务子应用。

当前主线已经覆盖三类能力：

- 统一后台基础：登录鉴权、角色权限、平台治理、主应用壳层、主规格与架构约束
- 业务域能力：SCRM 客户/线索/商机/经营闭环，OA 工作台/审批/公告/通讯录/行政申请
- 多租户扩展：租户隔离、租户运营、产品配置、开放平台、通知中心、工作流与企业交付底座

## 当前仓库结构

- `apps/main-web`：统一前端主应用，负责登录入口、导航壳层、平台原生页面与 OA/SCRM 子应用承载
- `apps/scrm-web`：SCRM 业务前端，覆盖客户、线索、商机、经营看板与系统管理
- `apps/oa-web`：OA 业务前端，覆盖工作台、审批、请假、行政申请、公告与通讯录
- `apps/api`：共享后端服务，工作区包名为 `platform-api`
- `apps/api/prisma`：数据库 schema、迁移与种子脚本
- `docs/development.md`：开发与验证约定
- `openspec/specs`：当前主规格
- `openspec/changes/archive`：已归档的 OpenSpec 变更记录

前端工作区统一遵循 `apps/<domain>-web` 命名约定。

## 当前能力概览

### 平台与治理

- 统一登录、会话续期、主动退出、平台级 RBAC 与数据范围控制
- 主应用统一导航壳层、`/platform/**` 平台治理域、`/workfeed` 统一待办与通知入口
- 平台治理工作台：部门、员工、角色、跨应用权限、细粒度策略预览
- 多租户基础：显式租户归属、请求租户上下文、仓储层租户收口
- 租户运营控制台：租户生命周期、状态与运营视图
- 产品配置中心：租户菜单、字段、表单与模板配置

### OA 与流程

- OA 工作台、请假申请、待我审批、我发起的申请
- 报销、出差、采购、用印等行政申请
- 公告通知、公告详情、组织通讯录
- 流程模板、流程节点、流程实例、任务、抄送与审批人解析

### SCRM 与经营

- 客户档案、标签、来源、状态、归属管理
- 线索、提醒、分配、转化与跟进
- 商机创建、阶段推进、归属调整、赢单/输单收口
- 赢单后经营闭环：报价、合同、回款计划、回款记录、续费提醒
- 经营看板：漏斗、排行、回款预测、审批时效等视图

### 开放平台与交付底座

- 租户级 Open API、Webhook、身份连接器治理
- 统一通知中心与跨域消息事件
- 审计日志、附件上传下载、批处理任务与基础治理接口
- 企业交付底座：可替换存储、异步任务与基础调度治理

## 当前主规格

`openspec/specs` 已同步为当前主规格，主要包含以下能力域：

- 平台基础：`access-control`、`backoffice-super-app-shell`、`backoffice-visual-language`、`codebase-architecture`
- 平台治理：`platform-governance-workspace`、`granular-access-governance`、`system-administration`
- 多租户平台：`tenant-isolation-foundation`、`tenant-operations-console`、`product-configuration-center`、`open-integration-platform`
- OA 与流程：`office-automation-workspace`、`administrative-requests`、`configurable-workflow-engine`、`unified-workfeed-center`、`enterprise-notification-center`
- SCRM 与经营：`customer-management`、`lead-followup`、`sales-opportunity-management`、`revenue-operations`、`operations-dashboard`
- 交付底座：`enterprise-delivery-foundation`

最近已归档的重要变更包括：

- `2026-04-17-stage-2-add-configurable-workflows-and-governance`
- `2026-04-18-stage-3-build-multi-tenant-open-platform`
- `2026-04-18-fix-multitenant-boundaries-and-microapp-contracts`

## 环境要求

- Node.js `20.x`
- `pnpm 10.x`
- Docker Desktop 或可用的 Docker daemon

## 安装依赖

```bash
pnpm install
```

## 环境变量

仓库当前提供以下模板文件：

- [`.env.example`](./.env.example)
- [`apps/api/.env.example`](./apps/api/.env.example)
- [`apps/main-web/.env.example`](./apps/main-web/.env.example)
- [`apps/oa-web/.env.example`](./apps/oa-web/.env.example)
- [`apps/scrm-web/.env.example`](./apps/scrm-web/.env.example)
- [`docs/development.md`](./docs/development.md)

核心变量说明：

- 根目录 `.env`：`POSTGRES_DB`、`POSTGRES_USER`、`POSTGRES_PASSWORD`、`POSTGRES_PORT`、`JWT_SECRET`
- `apps/api/.env`：`PORT`、`JWT_SECRET`、`DATABASE_URL`、`CORS_ALLOWED_ORIGINS`、`SWAGGER_ENABLED`、`ALLOW_MOCK_CONNECTOR_LOGIN`、`WEBHOOK_TEST_MODE`
- `apps/main-web/.env`：`VITE_API_BASE_URL`、`VITE_OA_ENTRY`、`VITE_SCRM_ENTRY`
- `apps/oa-web/.env`：`VITE_API_BASE_URL`
- `apps/scrm-web/.env`：`VITE_API_BASE_URL`

安全配置要求：

- `JWT_SECRET` 必须替换为至少 32 位随机字符串；后端启动时会拒绝空值、模板默认值或弱密钥。
- 非本地/测试环境必须显式配置 `CORS_ALLOWED_ORIGINS`，多个来源用英文逗号分隔；本地环境未配置时才允许开发态宽松 CORS。
- `SWAGGER_ENABLED` 未配置时只在本地/测试环境默认开启；生产环境需要显式配置才会暴露 `/docs`。
- `ALLOW_MOCK_CONNECTOR_LOGIN` 仅用于本地或测试环境的身份连接器联调，生产环境即使配置也不会允许 mock 登录。
- `WEBHOOK_TEST_MODE` 默认使用 `REAL` 真实 HTTP 投递测试；如需旧的字符串模拟联调，可在本地或测试环境显式设为 `SIMULATION`，页面会标记为“模拟测试”。
- 当前 refresh token 仍沿用主应用与子应用共享的浏览器存储；安全加固的过渡策略是先收紧刷新入口限流与审计，再迁移到 `HttpOnly; Secure; SameSite` cookie 并验证 qiankun 联调兼容。

默认模板口径：

- 数据库默认映射宿主机 `5433`
- API 默认地址 `http://localhost:3000/api`
- 主应用默认加载 `http://localhost:5174` 的 OA 子应用与 `http://localhost:5173` 的 SCRM 子应用

## 推荐本地开发流程

初始化数据库与 Prisma：

```bash
pnpm docker:infra
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

启动本地热更新开发：

```bash
pnpm dev:full
```

常用命令：

- `pnpm dev:api`
- `pnpm dev:main-web`
- `pnpm dev:oa-web`
- `pnpm dev:scrm-web`
- `pnpm docker:infra:logs`
- `pnpm docker:infra:down`

安全与展示相关变更至少运行：

```bash
pnpm --filter platform-api lint
pnpm --filter platform-api test
pnpm --filter main-web lint
pnpm --filter main-web test
pnpm --filter oa-web lint
pnpm --filter oa-web test
pnpm --filter scrm-web lint
pnpm --filter scrm-web test
openspec validate <change-name>
```

若改动涉及 `main-web` 壳层、qiankun 容器或 OA/SCRM 全局样式，还需要记录桌面、移动端、host 嵌入 OA、host 嵌入 SCRM、standalone OA/SCRM 的视觉检查结果。

默认本地地址：

- 主应用：`http://localhost:5175`
- SCRM 前端：`http://localhost:5173`
- OA 前端：`http://localhost:5174`
- 后端 API：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/docs`
- PostgreSQL：`localhost:5433`

说明：

- `pnpm dev:full` 会并行启动 `platform-api`、`main-web`、`oa-web` 和 `scrm-web`
- 主应用通过 `qiankun` 从 OA 与 SCRM 开发服务加载业务内容
- 日常开发优先使用本地热更新链路，而不是每次都重建容器镜像

## Docker 联调

当前 `docker-compose.yml` 启动的是：

- `postgres`
- `api`
- `scrm-web`

执行命令：

```bash
pnpm docker:up
```

停止容器：

```bash
pnpm docker:down
```

查看日志：

```bash
pnpm docker:logs
```

当前 Docker 默认地址：

- Docker 前端：`http://localhost:8080`
- Docker API：`http://localhost:3000/api`
- Docker Swagger：`http://localhost:3000/docs`
- Docker 健康检查：`http://localhost:3000/api/health`

说明：

- 现有 Docker 编排主要用于 PostgreSQL、API 与 `scrm-web` 的容器化联调
- `main-web` 与 `oa-web` 当前仍以本地开发服务联调为主

## Prisma 与种子数据

常用命令：

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

默认种子账号：

- 用户名：`admin`
- 密码：`Admin123456!`

默认角色：

- `super-admin`
- `sales-manager`
- `sales-member`

## 多租户与宿主边界

- `oa-web` 与 `scrm-web` 在 `qiankun` 宿主模式下，登录失效、主动退出和无权限页返回登录都会统一跳到主应用 `/login`
- 主应用与子应用已对齐同一路径的页面权限键，避免宿主菜单与子应用页面权限漂移
- OA、流程与开放平台相关仓储链路已收口到显式租户约束
- 租户级系统管理只保留本租户能力，不直接暴露平台级通知、存储和调度治理配置
- 平台级治理接口不再复用租户级字典权限码

## 关键模块入口

后端主要模块目录：

- `apps/api/src/modules/auth`
- `apps/api/src/modules/customers`
- `apps/api/src/modules/leads`
- `apps/api/src/modules/sales-opportunities`
- `apps/api/src/modules/revenue-operations`
- `apps/api/src/modules/office-automation`
- `apps/api/src/modules/workflow`
- `apps/api/src/modules/unified-workfeed`
- `apps/api/src/modules/notification-center`
- `apps/api/src/modules/open-integration`
- `apps/api/src/modules/product-configuration`
- `apps/api/src/modules/tenant-operations`
- `apps/api/src/modules/system-governance`
- `apps/api/src/modules/batch-tasks`
- `apps/api/src/modules/uploads`
- `apps/api/src/modules/audit-logs`

前端主要页面入口：

- 主应用：`apps/main-web/src/pages`
- OA：`apps/oa-web/src/pages`
- SCRM：`apps/scrm-web/src/pages`

## 构建与测试

类型检查：

```bash
pnpm --filter platform-api lint
pnpm --filter main-web lint
pnpm --filter oa-web lint
pnpm --filter scrm-web lint
```

单元测试：

```bash
pnpm --filter platform-api test
pnpm --filter main-web test
pnpm --filter oa-web test
pnpm --filter scrm-web test
```

构建：

```bash
pnpm --filter platform-api build
pnpm --filter main-web build
pnpm --filter oa-web build
pnpm --filter scrm-web build
```

仓库级校验：

```bash
pnpm prisma:generate
pnpm lint
pnpm test
pnpm build
```

CI 工作流位于 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)。

## 当前状态

- 当前 README 已按现有仓库结构、OpenSpec 主规格和归档状态更新
- `openspec/changes` 当前没有活动 change，最新变更已归档到 `openspec/changes/archive`
- 目前唯一保留的仓库级文档入口是 [`docs/development.md`](./docs/development.md)，原 README 中过期的阶段文档链接已移除
- 当前 Docker 编排、开发命令、测试命令与前端工作区列表已与实际 `package.json` 和 `docker-compose.yml` 对齐
