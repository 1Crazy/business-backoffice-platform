# 多应用业务后台平台

这是一个基于 `Vue 3 + TypeScript` 前端、`NestJS + Prisma` 后端、`PostgreSQL` 数据库的多应用后台平台仓库。当前已经落地 `scrm-web` 与 `oa-web` 两个后台前端，并复用统一的账号、角色权限、会话身份与组织架构体系。

当前仓库已经完成一期 SCRM MVP、二期平台硬化、商机管理能力以及 OA 首批办公协作闭环，能够覆盖认证、客户、线索、商机、跟进、看板、请假审批、公告通知、组织通讯录、审计与附件等核心后台流程。

当前仓库已经包含：

- `apps/main-web`：基于 `qiankun` 的统一前端主应用，负责登录入口、统一导航壳层与 OA/SCRM 子应用承载
- `apps/scrm-web`：Vue 3 + Vite + Pinia + Vue Router + Element Plus 的当前 SCRM 后台前端
- `apps/oa-web`：Vue 3 + Vite + Pinia + Vue Router + Element Plus 的 OA 后台前端
- `apps/api`：NestJS + JWT/RBAC + Prisma 的共享平台后端服务，工作区包名为 `platform-api`
- `docker-compose.yml`：本地 PostgreSQL、NestJS API、当前 SCRM Web 的容器编排配置
- `apps/api/prisma`：数据库 schema、初始迁移和种子脚本
- `openspec/specs`：当前已经同步完成的主规格
- `openspec/changes/archive/2026-04-05-bootstrap-scrm-mvp`：已归档的一期 MVP OpenSpec 变更记录
- `openspec/changes/archive/2026-04-06-sales-opportunity-management`：已归档的商机管理 OpenSpec 变更记录

前端工作区命名约定为 `apps/<domain>-web`。当前已经落地的是 `apps/main-web`、`apps/scrm-web` 和 `apps/oa-web`，后续新增其他后台前端也遵循同一规则。

## 当前能力范围

- 平台能力：统一登录身份、多应用权限目录、菜单与页面授权、会话续期与退出
- 主应用门户：统一登录、跨域菜单壳层、OA/SCRM 页面整合与 qiankun 子应用承载
- 账号登录、角色权限、菜单和接口授权
- 部门、员工、角色与权限管理
- 客户中心：客户档案、标签、来源、状态、归属人
- 商机管理：商机创建、编辑、详情、归属人转交、阶段推进、赢单/输单收口、阶段轨迹
- 线索与跟进：线索分配、线索转客户、跟进记录、待办提醒
- 运营看板：新增客户、跟进次数、线索转化率、新增商机、进行中预计金额、赢单数量、赢单金额、赢单率
- OA 办公协作：工作台、待我审批、我发起的申请、请假申请、公告通知、组织通讯录
- 系统管理：字典配置、审计日志、附件上传
- 二期平台硬化：会话续期与退出、统一数据范围、分页列表、附件下载鉴权、仓库级 CI

## 环境要求

- Node.js `20.x`
- `pnpm 10.x`
- Docker Desktop 或可用的 Docker daemon

## 二期平台硬化摘要

- 认证链路已升级为 `12h access token + 30d refresh session`，支持 `POST /api/auth/refresh` 和 `POST /api/auth/logout`。
- 客户、线索、提醒和审计日志列表统一升级为分页接口，返回 `items/page/pageSize/total/sortBy/sortOrder`。
- 角色数据范围支持 `SELF`、`DEPARTMENT`、`DEPARTMENT_AND_SUBTREE` 和 `ALL`，客户、线索、提醒、附件和看板统一复用同一套范围规则。
- 审计日志支持按操作类型、对象类型、操作人和时间范围筛选。
- 附件默认通过本地存储驱动落盘，上传大小限制 `10 MB`，下载统一走受保护接口 `GET /api/uploads/:id/download`。
- 仓库已补充 GitHub Actions CI，执行依赖安装、Prisma Client 生成、类型检查、测试和构建。

## 安装依赖

```bash
pnpm install
```

## 本地环境变量

仓库已提供环境变量模板文件：

- 根目录 [`.env.example`](./.env.example)
- 后端 [`apps/api/.env.example`](./apps/api/.env.example)
- 前端 [`apps/scrm-web/.env.example`](./apps/scrm-web/.env.example)
- 前端 [`apps/main-web/.env.example`](./apps/main-web/.env.example)
- 开发说明 [`docs/development.md`](./docs/development.md)

本地开发时可以基于这些模板生成对应的 `.env` 文件。当前工作区里已经存在可直接运行的本地 `.env`，如果需要自定义端口、数据库账号或 API 地址，可以按需修改。

补充说明：

- 根目录 `.env` 主要服务于 `docker-compose.yml`，除数据库变量外，建议同时配置 `JWT_SECRET`。
- `apps/api/.env` 当前需要 `PORT`、`JWT_SECRET` 和 `DATABASE_URL`。
- `apps/main-web/.env` 当前需要 `VITE_API_BASE_URL`、`VITE_OA_ENTRY` 和 `VITE_SCRM_ENTRY`。
- `apps/scrm-web/.env` 当前需要 `VITE_API_BASE_URL`。
- `apps/oa-web/.env` 当前同样需要 `VITE_API_BASE_URL`。

## Docker 一键启动

先确保 Docker daemon 已启动，然后执行：

```bash
pnpm docker:up
```

如果看到类似 “Cannot connect to the Docker daemon” 的提示，说明 Docker Desktop 还没有启动，需要先把本机 Docker 服务拉起。

也可以直接使用原生命令：

```bash
docker compose up -d --build
```

停止容器：

```bash
pnpm docker:down
```

查看日志：

```bash
pnpm docker:logs
```

默认访问地址：

- Docker 前端：`http://localhost:8080`
- Docker API：`http://localhost:3000/api`
- Docker Swagger：`http://localhost:3000/docs`
- Docker 健康检查：`http://localhost:3000/api/health`
- Docker PostgreSQL：`localhost:5433`

当前 Docker 启动流程会自动完成：

- PostgreSQL 启动并等待健康检查通过
- API 容器执行 `prisma generate`
- API 容器执行 `prisma migrate deploy`
- API 容器执行 `prisma db seed`
- Web 容器通过 Nginx 提供静态页面，并同源反向代理 `/api`

## 推荐开发工作流

日常开发默认不需要每次都走全量 Docker。推荐把数据库和应用热更新拆开：

日常前后端开发：

```bash
pnpm docker:infra
pnpm dev:full
```

只改前端时：

```bash
pnpm docker:infra
pnpm dev:main-web
pnpm dev:scrm-web
pnpm dev:oa-web
```

常用辅助命令：

```bash
pnpm docker:infra:logs
pnpm docker:infra:down
```

使用建议：

- `pnpm docker:infra`：只启动 PostgreSQL，适合本地热更新开发。
- `pnpm dev:full`：并行启动本地 `platform-api`、`main-web`、`oa-web` 和 `scrm-web`，适合验证主应用壳层与子应用联调。
- `pnpm dev:main-web`：只启动主应用宿主，适合配合已启动的子应用做壳层与导航调试。
- `pnpm docker:up`：全量构建并启动数据库、API、Web，更适合联调、验收和近部署环境验证，而不是日常每次改代码都执行。

## Prisma 初始化

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

说明：

- 当前仓库已经包含首版迁移文件：[`apps/api/prisma/migrations/20260405093000_init/migration.sql`](./apps/api/prisma/migrations/20260405093000_init/migration.sql)
- 如果本地数据库已启动，`pnpm prisma:migrate` 会把 schema 应用到 PostgreSQL
- `pnpm prisma:seed` 会初始化默认角色、权限、字典和管理员账号
- 当前默认会把 PostgreSQL 映射到宿主机 `5433`，用于避开常见的本机 `5432` 端口占用问题
- 如果你使用 `pnpm docker:up`，这些数据库初始化动作会在 API 容器启动时自动执行

如果你是在已有本地数据库上拉取最新商机能力，请额外执行一次：

```bash
pnpm --filter platform-api prisma migrate deploy
pnpm --filter platform-api seed
```

这样可以把 `Opportunity` / `OpportunityStageHistory` 相关表结构和 `opportunity:*` 权限同步到本地数据库；否则 `GET /api/dashboard/overview` 可能因为缺表报错，`GET /api/sales-opportunities` 也可能因为权限种子未更新而返回 `403`。

商机权限补充：

- `opportunity:read`：查看商机列表、详情与阶段轨迹
- `opportunity:write`：创建、编辑、推进阶段、赢单/输单收口
- `opportunity:assign`：重新分配商机负责人

默认角色授权补充：

- `super-admin`：默认拥有全部商机权限与全局数据范围
- `sales-manager`：默认拥有商机读写与分配权限，数据范围继承部门级规则
- `sales-member`：默认拥有商机读写权限，数据范围继承本人级规则

默认管理员账号：

- 用户名：`admin`
- 密码：`Admin123456!`

默认系统角色：

- `super-admin`：全局数据范围
- `sales-manager`：部门数据范围
- `sales-member`：本人数据范围

## 启动开发环境

推荐日常开发：

```bash
pnpm docker:infra
pnpm dev:full
```

分别启动单个服务时：

后端：

```bash
pnpm dev:api
```

前端：

```bash
pnpm dev:main-web
pnpm dev:scrm-web
pnpm dev:oa-web
```

停止开发用数据库：

```bash
pnpm docker:infra:down
```

默认地址：

- 主应用：`http://localhost:5175`
- SCRM 前端：`http://localhost:5173`
- OA 前端：`http://localhost:5174`
- 后端：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/docs`
- PostgreSQL：`localhost:5433`

补充说明：

- `pnpm dev:full` 使用本地热更新链路，不会重新构建前后端镜像；主应用通过 `qiankun` 从 `oa-web` 与 `scrm-web` 开发服务加载内容页。
- `pnpm docker:up` 仍然保留，用于全量联调和容器化验证。

## 构建与测试

类型检查：

```bash
pnpm --filter platform-api lint
pnpm --filter scrm-web lint
pnpm --filter oa-web lint
```

构建：

```bash
pnpm --filter platform-api build
pnpm --filter scrm-web build
pnpm --filter oa-web build
```

测试：

```bash
pnpm --filter platform-api test
pnpm --filter scrm-web test
pnpm --filter oa-web test
```

仓库级校验：

```bash
pnpm prisma:generate
pnpm lint
pnpm test
pnpm build
```

GitHub Actions 也会执行同样的校验流程，工作流文件位于 [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)。

## 二期接口与约束

分页列表：

- `GET /api/customers`
- `GET /api/leads`
- `GET /api/sales-opportunities`
- `GET /api/leads/reminders`
- `GET /api/audit-logs`

商机主接口：

- `POST /api/sales-opportunities`
- `PATCH /api/sales-opportunities/:id`
- `GET /api/sales-opportunities/:id`
- `PATCH /api/sales-opportunities/:id/owner`
- `PATCH /api/sales-opportunities/:id/stage`
- `PATCH /api/sales-opportunities/:id/mark-won`
- `PATCH /api/sales-opportunities/:id/mark-lost`

商机指标口径：

- 新增商机数按 `createdAt` 统计
- 进行中商机预计金额按当前进行中状态且 `expectedCloseDate` 落入时间范围统计
- 赢单商机数与赢单金额按 `closedAt` 统计
- 赢单率按同一时间范围内 `赢单数 / (赢单数 + 输单数)` 计算

## 商机验证路径

本次商机能力联调建议至少覆盖以下路径：

- 使用 `sales-manager` 或 `sales-member` 账号登录 `scrm-web`
- 进入“商机管理”页面，完成商机创建、编辑、重新分配、阶段推进与赢单/输单收口
- 打开商机详情抽屉，确认阶段轨迹按时间顺序可见
- 返回“运营看板”，确认新增商机、进行中预计金额、赢单数量、赢单金额和赢单率与相同时间范围内的业务数据口径一致

会话接口：

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

附件约束：

- 默认存储：本地磁盘 `uploads/`
- 大小上限：`10 MB`
- 下载入口：`GET /api/uploads/:id/download`
- 支持类型：PDF、JPEG/PNG、TXT/CSV、Word、Excel

## 浏览器验证

如果你要在本机执行浏览器级验证，建议先安装 Python Playwright 依赖和 Chromium：

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
```

当前仓库已经完成过以下真实浏览器验证：

- Chromium 登录流程可用
- Docker 启动后的前后端联调可用
- `/dashboard`、`/departments`、`/customers`、`/leads`、`/system` 已完成主流程巡检
- `/dashboard`、`/opportunities` 在商机迁移与 seed 更新后已完成登录态冒烟验证
- `390 / 768 / 1440` 三档宽度下，主页面已完成响应式回归

二期收口时建议补充以下验证：

- 登录后自动续期、主动退出、会话失效恢复流程
- 客户、线索、提醒、审计日志的分页、筛选、排序与翻页状态保留
- 数据范围变化后看板空态和指标说明
- 附件上传大小与类型校验、受保护下载

## 当前状态

- 当前代码可以正常通过前后端类型检查、构建与单元测试。
- 当前 Docker 全量启动已经验证通过，前端 `8080`、后端 `3000`、数据库 `5433` 均可访问，默认管理员账号可正常登录。
- OpenSpec 一期变更 `bootstrap-scrm-mvp` 已同步到主规格并归档。
- OpenSpec 二期变更 `phase2-platform-hardening` 已完成实现与本地验证，主要增量为会话治理、分页与数据范围、审计和附件硬化、CI 校验。
- OpenSpec 变更 `sales-opportunity-management` 已同步到主规格并归档，主 spec 位于 `openspec/specs/sales-opportunity-management/spec.md`。
