# 验证记录

日期：2026-05-01

## 已通过的自动化验证

- `pnpm --filter platform-api lint`
- `pnpm --filter platform-api test`
- `pnpm --filter main-web lint`
- `pnpm --filter oa-web lint`
- `pnpm --filter scrm-web lint`
- `pnpm --filter main-web test`
- `pnpm --filter oa-web test`
- `pnpm --filter scrm-web test`
- `pnpm architecture:check`
- `openspec validate close-platform-security-operational-gaps --strict`
- `docker compose config`
- `docker compose up -d --build`

## 已补充的针对性覆盖

- 认证与会话加固：短 access token TTL、cookie-only refresh、refresh token 轮换、旧 refresh token 重放拒绝、退出登录清理 cookie。
- 前端会话迁移：三个前端应用均移除 `platform-refresh-token` 成功路径存储，并改为依赖 cookie 刷新。
- 风险限流：覆盖内存 store 与数据库共享 store 的契约、锁定窗口和成功后清理。
- 可观测性：覆盖请求 ID、结构化日志、指标输出和健康检查依赖状态。
- 租户配额：覆盖活跃用户数、附件存储字节数、月度任务数、租户范围统计和配额拒绝审计上下文。

## Docker 冒烟验证状态

`docker compose up -d --build` 在 2026-05-01 最初两次失败，原因是 Docker Hub 拉取基础镜像 metadata 超时，涉及 `postgres:16-alpine`、`node:20-alpine`、`node:20-bullseye-slim` 和 `nginx:1.27-alpine`。

网络恢复后，重新执行同一命令已成功完成构建与启动。

已验证：

- `postgres`、`api`、`main-web`、`oa-web`、`scrm-web` 容器已启动。
- `api` 容器健康检查为 healthy。
- `/api/health` 返回 `200`，数据库依赖状态为 `ok`。
- 健康检查响应会回传 `X-Request-Id`。
- `main-web`、`oa-web`、`scrm-web` 静态入口返回 `200`，并包含 CSP 和安全响应头。
- `oa-web` 与 `scrm-web` 返回 `Access-Control-Allow-Origin: http://localhost:8080`，满足 qiankun 宿主加载。
- 登录接口返回 access token 和 `HttpOnly` refresh cookie，响应体不包含 refresh token。
- refresh 接口只依赖 cookie 即可刷新，并返回轮换后的 refresh cookie。
- logout 接口会清理 refresh cookie。
- 客户附件上传冒烟通过真实 API 成功。
- 用户配额拒绝冒烟返回 `400`，响应包含 `租户用户配额不足`；验证后已恢复原租户配额。

补充说明：

- 首次宿主机访问曾成功拿到 `/api/health` 和前端安全响应头。
- 后续 Docker Desktop 宿主端口转发变为不可达：容器仍 healthy，`docker compose ps` 仍显示 `0.0.0.0:3000/8080/8081/8082` 映射，`lsof` 也能看到 `com.docke` 正在监听 `3000` 和 `8080`，但宿主侧 `curl localhost:<port>` 返回连接失败，`nc -vz localhost 3000` 返回 `Operation not permitted`。
- 2026-05-01 再次复测后，重启 `api/main-web/oa-web/scrm-web` 容器仍未恢复宿主端口访问；容器内 `http://127.0.0.1:3000/api/health` 仍返回 `200`。结论：未完成的网络项是本机/沙箱到 Docker Desktop 发布端口的访问权限问题，不是应用容器或 compose 拓扑问题。
- 因宿主端口转发异常，后续登录、刷新、上传、配额拒绝等冒烟改为在 Docker 网络内执行，调用的仍是真实 API 与真实容器。
- 未做浏览器视觉渲染检查；已通过 HTTP 检查静态入口、qiankun 子应用 HTML 和响应头。

## 本地开发环境复测

Docker Desktop 重启后，改走本地热更新链路复测：

- `docker compose up -d postgres` 已启动 PostgreSQL，容器健康状态为 `healthy`，宿主映射为 `localhost:5433`。
- `pnpm dev:full` 已启动本地 `platform-api`、`main-web`、`oa-web` 与 `scrm-web`。
- 后端 `http://127.0.0.1:3000/api/health` 返回 `200`，数据库依赖状态为 `ok`，响应包含 `X-Request-Id`。
- 三个前端入口 `http://localhost:5175`、`http://localhost:5174`、`http://localhost:5173` 均返回 `200`。
- 登录接口返回 `accessToken` 与 `platform_refresh_token` 的 `HttpOnly` cookie，响应体不包含 `refreshToken`。
- refresh 接口仅依赖 cookie 即可刷新，并返回轮换后的 `HttpOnly` refresh cookie。
- 使用旧 refresh cookie 重放刷新返回 `401 Session is invalid.`。
- 按真实前端方式携带 access token 调用 logout 返回成功，并下发过期的 `platform_refresh_token` 清理 cookie。
- Playwright 浏览器冒烟已从 `http://localhost:5175/login` 登录到平台治理页面；浏览器 `localStorage` 有 access token 与会话过期时间，没有 `platform-refresh-token`；refresh cookie 元数据为 `domain=localhost`、`path=/api`、`HttpOnly=true`、`SameSite=Lax`。
- 本地修正后复跑 `pnpm --filter main-web lint`、`pnpm --filter oa-web lint`、`pnpm --filter scrm-web lint`、`pnpm architecture:check` 均通过。
- 本地修正后复跑 `openspec validate close-platform-security-operational-gaps --strict`，变更校验为 valid；结束阶段 PostHog 遥测上报因 `edge.openspec.dev` DNS 不可达失败，不影响 OpenSpec 校验结果。

本次复测中发现并修正：

- 三个 Vite 开发服务器默认地址统一为 `localhost`，继续保持本机监听，不再默认输出 `127.0.0.1`。
- API 本地 CORS 示例与实际 `.env` 已补充 `127.0.0.1:5173/5174/5175` 来源，方便 HTTP 层复测；浏览器登录联调仍推荐使用 `localhost`，避免 `localhost` 与 `127.0.0.1` 混用导致 refresh cookie 不保存。
- 普通沙箱下 Node/Playwright 访问本机端口曾出现 `EPERM`；提升权限执行后 smoke 通过。该问题属于本机执行权限限制，不是应用服务启动失败。

## 剩余风险

- `scripts/architecture-check-baseline.json` 中记录了既有超长 Vue 文件，用于让架构检查可重复通过；这些文件应在独立清理变更中继续拆分。
- 租户配额目前是写入前校验，高并发下仍可能存在竞争窗口；后续可引入用量台账或事务型额度预占模型。
- Docker Desktop 宿主端口转发需要单独复查；如果浏览器无法访问 `localhost:8080`，但容器内网络正常，应优先检查 Docker Desktop 网络/端口代理状态。
- 本地开发应统一使用 `localhost` 入口；如果手动改 `VITE_API_BASE_URL` 为 `127.0.0.1`，需要同步调整访问入口和 CORS 来源，避免 cookie 站点不一致。

## 回滚路径

- 认证与会话回滚必须同时回滚 API 和三个前端应用，因为前端已不再保存 refresh token。
- 风险限流数据库 store 如需回滚，只允许本地/测试环境设置 `RISK_THROTTLE_STORE=memory`；生产不应回退到进程内限流。
- 租户配额强制执行可通过移除 users、uploads、batch tasks 入口中的 `TenantQuotaService` 调用回滚；repository 与测试可保留作为后续恢复参考。
- Docker、安全响应头和运维文档改动隔离在 Dockerfile、nginx 配置、compose 和文档中，可独立回滚，不涉及数据库迁移。
