# 开发与验证说明

本文档补充二期平台硬化后的开发约定，重点覆盖会话治理、分页接口、附件限制和本地验证流程。

## 环境变量

根目录 `.env` 用于 `docker-compose.yml`：

- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_PORT`
- `JWT_SECRET`

后端 `apps/api/.env`：

- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`

前端 `apps/web/.env`：

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

启动前后端：

```bash
pnpm dev:api
pnpm dev:web
```

或使用 Docker 全量联调：

```bash
pnpm docker:up
```

## 验证清单

建议至少执行一次完整校验：

```bash
pnpm prisma:generate
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
