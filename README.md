# SCRM 管理系统 MVP

这是一个基于 `Vue 3 + TypeScript` 前端、`NestJS + Prisma` 后端、`PostgreSQL` 数据库的单租户 SCRM 管理系统初版。

当前仓库已经包含：

- `apps/web`：Vue 3 + Vite + Pinia + Vue Router + Element Plus 后台前端
- `apps/api`：NestJS + JWT/RBAC + Prisma 后端服务
- `docker-compose.yml`：本地 PostgreSQL、NestJS API、Vue Web 的容器编排配置
- `apps/api/prisma`：数据库 schema、初始迁移和种子脚本
- `openspec/specs`：当前已经同步完成的主规格
- `openspec/changes/archive/2026-04-05-bootstrap-scrm-mvp`：已归档的一期 MVP OpenSpec 变更记录

## 一期范围

- 账号登录、角色权限、菜单和接口授权
- 部门、员工、角色与权限管理
- 客户中心：客户档案、标签、来源、状态、归属人
- 线索与跟进：线索分配、线索转客户、跟进记录、待办提醒
- 运营看板：新增客户、跟进次数、线索转化率
- 系统管理：字典配置、审计日志、附件上传

## 环境要求

- Node.js `20.x`
- `pnpm 10.x`
- Docker Desktop 或可用的 Docker daemon

## 安装依赖

```bash
pnpm install
```

## 本地环境变量

仓库已提供环境变量模板文件：

- 根目录 [`.env.example`](/Users/hong/Documents/my-project/scrm-test/.env.example)
- 后端 [`apps/api/.env.example`](/Users/hong/Documents/my-project/scrm-test/apps/api/.env.example)
- 前端 [`apps/web/.env.example`](/Users/hong/Documents/my-project/scrm-test/apps/web/.env.example)

本地开发时可以基于这些模板生成对应的 `.env` 文件。当前工作区里已经存在可直接运行的本地 `.env`，如果需要自定义端口、数据库账号或 API 地址，可以按需修改。

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

## 启动开发环境

后端：

```bash
pnpm dev:api
```

前端：

```bash
pnpm dev:web
```

默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:3000/api`
- Swagger：`http://localhost:3000/docs`
- PostgreSQL：`localhost:5433`

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

## 当前状态

- 当前代码可以正常通过前后端类型检查、构建与单元测试。
- 当前 Docker 全量启动已经验证通过，前端 `8080`、后端 `3000`、数据库 `5433` 均可访问，默认管理员账号可正常登录。
- OpenSpec 一期变更 `bootstrap-scrm-mvp` 已同步到主规格并归档。
