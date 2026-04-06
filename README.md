# SCRM 管理系统 MVP

这是一个基于 `Vue 3 + TypeScript` 前端、`NestJS + Prisma` 后端、`PostgreSQL` 数据库的单租户 SCRM 管理系统。当前仓库已经完成一期 MVP 和二期平台硬化，能够覆盖认证、客户、线索、跟进、看板、审计与附件等核心后台流程。

当前仓库已经包含：

- `apps/web`：Vue 3 + Vite + Pinia + Vue Router + Element Plus 后台前端
- `apps/api`：NestJS + JWT/RBAC + Prisma 后端服务
- `docker-compose.yml`：本地 PostgreSQL、NestJS API、Vue Web 的容器编排配置
- `apps/api/prisma`：数据库 schema、初始迁移和种子脚本
- `openspec/specs`：当前已经同步完成的主规格
- `openspec/changes/archive/2026-04-05-bootstrap-scrm-mvp`：已归档的一期 MVP OpenSpec 变更记录

## 当前能力范围

- 账号登录、角色权限、菜单和接口授权
- 部门、员工、角色与权限管理
- 客户中心：客户档案、标签、来源、状态、归属人
- 线索与跟进：线索分配、线索转客户、跟进记录、待办提醒
- 运营看板：新增客户、跟进次数、线索转化率
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

- 根目录 [`.env.example`](/Users/hong/Documents/my-project/scrm-test/.env.example)
- 后端 [`apps/api/.env.example`](/Users/hong/Documents/my-project/scrm-test/apps/api/.env.example)
- 前端 [`apps/web/.env.example`](/Users/hong/Documents/my-project/scrm-test/apps/web/.env.example)
- 开发说明 [`docs/development.md`](/Users/hong/Documents/my-project/scrm-test/docs/development.md)

本地开发时可以基于这些模板生成对应的 `.env` 文件。当前工作区里已经存在可直接运行的本地 `.env`，如果需要自定义端口、数据库账号或 API 地址，可以按需修改。

补充说明：

- 根目录 `.env` 主要服务于 `docker-compose.yml`，除数据库变量外，建议同时配置 `JWT_SECRET`。
- `apps/api/.env` 当前需要 `PORT`、`JWT_SECRET` 和 `DATABASE_URL`。
- `apps/web/.env` 当前需要 `VITE_API_BASE_URL`。

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
pnpm dev:web
```

常用辅助命令：

```bash
pnpm docker:infra:logs
pnpm docker:infra:down
```

使用建议：

- `pnpm docker:infra`：只启动 PostgreSQL，适合本地热更新开发。
- `pnpm dev:full`：并行启动本地 API 和 Web，适合高频改代码。
- `pnpm docker:up`：全量构建并启动数据库、API、Web，更适合联调、验收和近部署环境验证，而不是日常每次改代码都执行。

## Prisma 初始化

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

说明：

- 当前仓库已经包含首版迁移文件：[`apps/api/prisma/migrations/20260405093000_init/migration.sql`](/Users/hong/Documents/my-project/scrm-test/apps/api/prisma/migrations/20260405093000_init/migration.sql)
- 如果本地数据库已启动，`pnpm prisma:migrate` 会把 schema 应用到 PostgreSQL
- `pnpm prisma:seed` 会初始化默认角色、权限、字典和管理员账号
- 当前默认会把 PostgreSQL 映射到宿主机 `5433`，用于避开常见的本机 `5432` 端口占用问题
- 如果你使用 `pnpm docker:up`，这些数据库初始化动作会在 API 容器启动时自动执行

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
pnpm dev:web
```

停止开发用数据库：

```bash
pnpm docker:infra:down
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/docs`
- PostgreSQL：`localhost:5433`

补充说明：

- `pnpm dev:full` 使用本地热更新链路，不会重新构建前后端镜像。
- `pnpm docker:up` 仍然保留，用于全量联调和容器化验证。

## 构建与测试

类型检查：

```bash
pnpm --filter @scrm/api lint
pnpm --filter @scrm/web lint
```

构建：

```bash
pnpm --filter @scrm/api build
pnpm --filter @scrm/web build
```

测试：

```bash
pnpm --filter @scrm/api test
pnpm --filter @scrm/web test
```

仓库级校验：

```bash
pnpm prisma:generate
pnpm lint
pnpm test
pnpm build
```

GitHub Actions 也会执行同样的校验流程，工作流文件位于 [`.github/workflows/ci.yml`](/Users/hong/Documents/my-project/scrm-test/.github/workflows/ci.yml)。

## 二期接口与约束

分页列表：

- `GET /api/customers`
- `GET /api/leads`
- `GET /api/leads/reminders`
- `GET /api/audit-logs`

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
