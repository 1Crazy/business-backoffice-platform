## Why

最新风险复核显示，第一批认证、开放集成和上传加固已经解决了部分高危入口，但系统仍存在会话存储、令牌生命周期、限流可扩展性、运行可观测性、容器化交付和租户配额执行等生产化缺口。若继续以当前状态进入多实例或准生产环境，XSS 后果、凭证泄露窗口、跨实例暴力尝试、故障排查和资源滥用风险仍然不可控。

## What Changes

- 将前端 refresh token 从 `localStorage` 迁移到后端 `HttpOnly` cookie，前端刷新请求不再读取或提交 refresh token 明文。
- 缩短 access token 生命周期，并实现 refresh token 轮换和重放检测，降低令牌泄露后的有效攻击窗口。
- 将登录、刷新、Open API 凭证和开放集成风险限流抽象为可外置存储的能力，生产环境必须支持跨实例共享计数。
- 建立请求追踪与可观测性基线：请求 ID、结构化日志、错误日志上下文和基础健康/指标端点。
- 完整容器化 `main-web`、`oa-web`、`scrm-web` 与 API 的近生产联调路径，并补齐备份、恢复和优雅关闭文档/脚本。
- 在租户用户数、存储和月度任务入口执行配额校验，不再只在租户看板展示用量。
- 收紧前端安全响应头和开发服务器暴露面，明确 CSP、HMR host 和开发态监听边界。

## Capabilities

### New Capabilities

- `platform-observability`: 平台具备请求追踪、结构化日志、健康检查、指标暴露和故障关联分析基础能力。
- `platform-operations-runbook`: 平台具备容器化联调、数据库备份恢复、优雅关闭和运行手册等交付运维基础能力。

### Modified Capabilities

- `access-control`: 会话刷新必须依赖 `HttpOnly` cookie 与 refresh token 轮换，access token TTL 必须可配置且默认短周期，密码策略必须达到基础复杂度要求。
- `open-integration-platform`: 开放平台 Webhook 必须支持租户级目标域名 allowlist，风险限流必须支持跨实例共享存储。
- `tenant-isolation-foundation`: 租户配额必须在用户创建、附件写入和任务创建等资源入口强制执行。
- `enterprise-delivery-foundation`: 附件上传必须纳入租户存储配额校验，并记录可用于容量治理的用量变化。
- `codebase-architecture`: 前端应用和近生产 Docker 编排必须覆盖主应用与所有子应用，并提供安全响应头和开发服务器暴露边界。

## Impact

- Affected code:
  - `apps/api/src/main.ts`
  - `apps/api/src/app.controller.ts`
  - `apps/api/src/common/security/**`
  - `apps/api/src/common/prisma/prisma.service.ts`
  - `apps/api/src/modules/auth/**`
  - `apps/api/src/modules/open-integration/**`
  - `apps/api/src/modules/uploads/**`
  - `apps/api/src/modules/tenant-operations/**`
  - `apps/api/src/modules/batch-tasks/**`
  - `apps/main-web/src/auth/**`
  - `apps/main-web/src/api/http.ts`
  - `apps/oa-web/src/auth/**`
  - `apps/oa-web/src/api/http.ts`
  - `apps/scrm-web/src/auth/**`
  - `apps/scrm-web/src/api/http.ts`
  - `apps/*/vite.config.ts`
  - `docker-compose.yml`
  - `apps/*/Dockerfile`
  - `docs/**`
- Affected APIs:
  - `/api/auth/login`
  - `/api/auth/refresh`
  - `/api/auth/logout`
  - `/api/uploads/**`
  - `/api/open-integration/**`
  - `/api/open-api/**`
  - `/api/health`
  - future `/api/metrics`
- Dependencies/systems:
  - May require Redis or an equivalent shared store for production risk throttling.
  - May require reverse proxy configuration for CSP and frontend security headers.
  - Requires deployment environment variables for token TTL, cookie domain, allowed webhook domains, log level and metrics exposure.
