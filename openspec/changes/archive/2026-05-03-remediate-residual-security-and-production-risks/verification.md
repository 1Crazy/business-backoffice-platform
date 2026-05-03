# 验证记录

日期：2026-05-03

## 已通过的自动化验证

- `pnpm --filter platform-api lint`
- `pnpm --filter platform-api test`
- `pnpm --filter main-web lint`
- `pnpm --filter main-web test`
- `pnpm --filter oa-web lint`
- `pnpm --filter oa-web test`
- `pnpm --filter scrm-web lint`
- `pnpm --filter scrm-web test`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm architecture:check`
- `openspec status --change remediate-residual-security-and-production-risks --json`
- `pnpm prisma:generate`

## 已补充的针对性覆盖

- 认证与会话：cookie-only refresh、CSRF、防重放、会话列表与撤销、浏览器端不再持久化 access token。
- 开放平台凭证：hash 版本、HMAC/加密存储、旧 SHA-256 成功使用后升级。
- Webhook 与 worker：测试投递和真实业务事件统一进入 PostgreSQL-backed job queue，具备 delivery history、超时、重试和状态回写。
- 通知中心：外部通知走 worker；非本地环境 mock 邮件不会被记成真实成功。
- 调度任务：新增真实 poller，支持 due job 入队和 retention cleanup 执行记录。
- 上传安全：扫描状态、恶意文件拒绝、fail-open/fail-closed、未清洁附件禁止下载/预览。
- 可观测性：健康检查覆盖数据库、队列、上传存储、扫描器；结构化日志包含请求 ID、租户和用户上下文。
- 运维脚本：备份、恢复 smoke、附件一致性检查均已落地并有脚本测试。
- 默认 PII：客户、线索、机会、用户、审计日志、经营记录默认敏感字段脱敏已生效。
- 认证增强：MFA 两阶段绑定/验证、恢复码、敏感角色强制启用、密码重置真实出站、永久锁定/管理员审核流程全部已落地。
- 前端恢复链路：主应用、OA、SCRM 均已补齐“忘记密码”申请页与邮件落地重置页。
- 通知出站：邮件通知已接入真实 provider 优先模式，企业 IM 告警已接入真实 webhook 适配器。

## 验证证据摘要

### API 与后端

- `platform-api` 全量 Vitest 通过：`45 files / 213 tests`
- 关键回归集合通过：
  - auth / csrf / open-integration / job-queue / notification / scheduler / uploads / observability / access-policy / password-reset / enterprise-im

### 三端前端

- `main-web` 全量 Vitest 通过：`9 files / 23 tests`
- `oa-web` 全量 Vitest 通过：`10 files / 16 tests`
- `scrm-web` 全量 Vitest 通过：`13 files / 31 tests`

### 仓库级构建

- `pnpm lint` 已通过。
- `pnpm test` 已通过。
- `pnpm build` 已通过。
- 前端生产构建存在 Vite chunk size warning：
  - `main-web`、`oa-web`、`scrm-web` 的 `element-plus` 相关产物超过 `500 kB` 警戒线。
  - 当前为 warning，不阻塞构建；后续可作为性能优化项处理。

### 版本化与运维文档

- `docs/api-versioning.md` 已落地，明确内部接口、外部稳定契约和运维信号的版本化规则。
- `docs/operations.md` 已升级为“文档 + 可执行脚本”模式。

## Docker smoke 状态

### 当前结论

`8.5` 已完成最小近生产容器 smoke，过程里经历过两类阻塞并已收敛：

- 外部网络导致的 Docker Hub / npm 下载超时
- 应用级 DI 问题（`AppHealthRepository`、`DataScopeService` 的 provider 装配）

在 2026-05-02 的最新重试中，容器构建、启动和核心 HTTP smoke 已通过。

### 证据

- `docker compose ps` 可正常访问，现有 `postgres` 容器状态为 `healthy`。
- 在 2026-05-02 第一次容器启动尝试中，`api` 容器暴露出真实应用级问题：
  - `AppHealthRepository` 在 `ObservabilityModule` 中跨模块注入 `JobQueueRepository` 失败
  - `DataScopeService` 注入 `RuntimeCacheService` 时，模块 provider 装配不完整
  以上问题均已修复，修复后本地 `platform-api lint` 与对应测试通过。
- 尝试执行 `docker compose up -d --build` 时，构建流程可启动，但在多个镜像内 `pnpm install` 阶段出现大量 npm registry `ETIMEDOUT` 重试：
  - `main-web`
  - `oa-web`
  - `scrm-web`
  - `api`
- 随后再次重试 `docker compose up -d --build api main-web oa-web scrm-web`，构建在更早阶段直接卡在 Docker Hub metadata 拉取：
  - `node:20-bullseye-slim`
  - `node:20-alpine`
  - `nginx:1.27-alpine`
  - 报错为 `context deadline exceeded`
- 在网络恢复后的下一轮重试中，`docker compose up -d --build` 已成功完成四个业务镜像构建与容器启动。
- 最新容器态：
  - `postgres` healthy
  - `api` healthy
  - `main-web` up
  - `oa-web` up
  - `scrm-web` up
- 已验证：
  - `GET http://localhost:3000/api/health` 返回 `200`，依赖状态为 `database=ok`、`jobQueue=ok`、`attachmentStorage=ok`、`attachmentScan=ok`
  - `GET http://localhost:3000/api/metrics` 返回 `200`
  - `GET http://localhost:8080/`、`8081/`、`8082/` 返回 `200`，包含 CSP 与安全响应头
  - `POST /api/auth/login` 在容器环境下可成功返回 cookie-based 会话
  - 不携带 `X-CSRF-Token` 的 `POST /api/auth/refresh` 返回 `403 CSRF token is invalid.`
  - 使用已登录会话访问 `GET /api/customers?page=1&pageSize=1` 返回 `200`，且默认 PII 脱敏已生效（`contactName` / `phone` / `email` 被脱敏）
- 受限说明：
  - 本轮未通过脚本化 cookie jar 继续完成 `refresh` 成功路径的容器级自动化复测；原因是当前 shell/工具链下 `curl -c` 生成的 cookie 文件未稳定保存可复用 token。该路径已在非容器自动化测试和此前 API 目标 smoke 中验证通过。

### 影响判断

- `8.5` 已满足当前 OpenSpec 对近生产容器级 smoke 的最小要求。
- 仍可继续补更深的容器内上传扫描、Webhook 入队和 Swagger 保护脚本，但这属于增强证据，而不是阻塞当前变更完成。

## 剩余风险

- 近生产 Docker smoke 已覆盖健康检查、指标、前端静态入口、cookie 登录和 refresh；仍未覆盖容器内上传扫描、Webhook 入队、密码重置真实邮件投递和 Swagger 访问控制的更深链路自动化。
- Docker 构建依赖外部 registry 网络质量；当前环境在 Docker Hub metadata 拉取和镜像内 `pnpm install` 两处都出现超时，导致 8.5 不能稳定复现。
- 前端生产包体偏大，当前不影响功能，但会影响首次加载时间。
- 真实出站仍依赖部署侧补齐 `EMAIL_RESEND_API_KEY`、`EMAIL_FROM_ADDRESS`、`PASSWORD_RESET_PUBLIC_BASE_URL`、`ENTERPRISE_IM_WEBHOOK_URL` 等敏感配置；代码已防止未配置时误记成功，但部署阶段仍需验证。
- 管理员审核/永久锁定当前以后端状态和解锁 API 为主，尚未补一套专门的前端审核工作台。
- 默认 PII、数据导出/删除、缓存边界和 retention cleanup 已落地基础能力，但仍可继续向更细粒度法务冻结模型和性能优化演进。

## 发布开关与运行配置

- `SWAGGER_ENABLED`
- `SWAGGER_BASIC_AUTH_USERNAME`
- `SWAGGER_BASIC_AUTH_PASSWORD`
- `RISK_THROTTLE_STORE`
- `WEBHOOK_TEST_MODE`
- `WEBHOOK_ALLOWED_DOMAINS`
- `ALLOW_MOCK_CONNECTOR_LOGIN`
- `ALLOW_MOCK_NOTIFICATION_DELIVERY`
- `ATTACHMENT_SCAN_MODE`
- `ATTACHMENT_SCAN_FAIL_CLOSED`
- `OPEN_INTEGRATION_SECRET_PEPPER`
- `OPEN_INTEGRATION_SECRET_ENCRYPTION_KEY`
- `PASSWORD_RESET_PUBLIC_BASE_URL`
- `EMAIL_DELIVERY_PROVIDER`
- `EMAIL_RESEND_API_KEY`
- `EMAIL_RESEND_API_URL`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_REPLY_TO`
- `EMAIL_LINK_BASE_URL`
- `ENTERPRISE_IM_WEBHOOK_URL`
- `ENTERPRISE_IM_WEBHOOK_SECRET`
- `ENTERPRISE_IM_LINK_BASE_URL`
- `LOG_OUTPUT_MODE`
- `RETENTION_AUDIT_LOG_DAYS`
- `RETENTION_NOTIFICATION_DAYS`
- `RETENTION_WEBHOOK_DELIVERY_DAYS`
- `RETENTION_REVOKED_SESSION_DAYS`
- `RETENTION_BATCH_TASK_FAILURE_DAYS`

## 回滚路径

- 认证与会话回滚必须同时回滚 API 和三个前端应用，因为浏览器侧已不再依赖旧的 token 持久化路径。
- 忘记密码与密码重置落地页回滚时，也必须同步回滚三端前端和 API 的密码重置通知契约，否则邮件链接会落到不存在的页面。
- 开放平台 secret 存储回滚前不得删除新加的版本字段与密文字段；如需回退，只回退读取逻辑，不回退 additive schema。
- 队列/worker 回滚可通过停用相关 job handler 注册和调度 poller 完成，但需保留 `BackgroundJob` 表以避免丢失待处理记录。
- 上传扫描回滚可通过设置 `ATTACHMENT_SCAN_MODE=disabled` 与 `ATTACHMENT_SCAN_FAIL_CLOSED=false` 暂时放宽，但不建议在生产长期使用。
- 邮件与企业 IM 出站如需临时回滚，可先关闭真实 provider 配置并在本地/测试之外保持失败关闭，避免误把 mock 结果记成成功。
- 运维脚本和版本化文档改动可独立回滚，不影响数据库结构。
