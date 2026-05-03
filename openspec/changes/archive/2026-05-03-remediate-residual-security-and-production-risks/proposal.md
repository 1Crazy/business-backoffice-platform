## 背景

本轮风险复核确认，上一轮平台安全与运维加固已经覆盖 refresh cookie、共享风险限流、请求 ID、基础健康检查、CI 和上传内容一致性等能力，但仍有若干真实残留风险会影响准生产和生产使用：浏览器持久化 access token、refresh token 请求体兼容入口、开放平台凭证快速哈希、CSP 过宽、缺少 CSRF 防护、外部投递同步阻塞以及自动化运维/合规能力不足。

这次变更用于把已核实的残留 P0/P1/P2 风险收敛成可实施的安全生产化计划，同时明确哪些审计项与当前仓库证据不符，避免重复建设。

## 变更内容

- **BREAKING**: 浏览器端不再把 access token 持久化到 `localStorage`；受保护 API 访问改为 cookie/BFF 模式或内存态短令牌模式，并具备迁移期退出/刷新兼容策略。
- **BREAKING**: `/api/auth/refresh` 不再接受请求体 refresh token fallback，只接受 `HttpOnly` refresh cookie。
- 为 cookie 参与认证或刷新后的状态变更接口增加 CSRF 防护，覆盖登录后写操作、刷新、退出和外部身份登录回调边界。
- 将 Open API secret、身份连接器 client secret、Webhook signing secret 从单次 SHA-256 或明文存储迁移到可版本化的强保护方案：慢哈希/带密钥哈希用于不可逆凭证，应用级加密用于必须回读的签名密钥。
- 收紧 qiankun 兼容 CSP，拆分生产与本地开发策略，减少 `unsafe-inline` / `unsafe-eval` 的默认暴露面并提供验证脚本。
- 为普通业务 CRUD 和高成本查询补齐全局/分层 API 限流策略，避免只保护登录、刷新和 Open API。
- 将 Webhook 投递、外部通知、批任务和调度执行从请求线程中解耦到可治理队列/worker，并补齐真实调度执行器。
- 将通知中心外部渠道从 mock 发送推进到可配置真实适配器，同时保留模拟模式和审计记录。
- 补齐自动化备份/恢复校验、附件一致性校验、数据保留清理、Swagger 访问控制、生产 compose 暴露面和 `.env.example` 安全占位约束。
- 将 MFA、密码重置、会话管理、默认 PII 脱敏、数据导出/删除等合规能力纳入规划任务，但不把单数据库高可用、读写分离等基础设施拓扑改造塞进本次代码实现。

## 能力范围

### 新增能力

- `data-protection-and-retention`: 数据保护、默认 PII 脱敏、数据保留清理、合规导出/删除和备份一致性治理。

### 修改能力

- `access-control`: 会话存储、refresh 接口、CSRF、MFA、密码重置、会话治理和账号锁定要求升级。
- `open-integration-platform`: 开放平台凭证与 Webhook 密钥存储方式升级，外部投递从同步请求线程迁移到异步队列。
- `codebase-architecture`: 前端 CSP、API 版本化、生产 compose 暴露面、`.env.example` 与 CI 安全护栏要求升级。
- `platform-observability`: 全局限流、日志/APM 接入、指标保护和依赖健康检查要求升级。
- `platform-operations-runbook`: 自动备份、恢复演练、附件一致性校验和 Swagger 访问控制要求升级。
- `enterprise-delivery-foundation`: 上传文件病毒扫描、调度执行器、批任务队列和缓存策略要求升级。
- `enterprise-notification-center`: 邮件和企业 IM 真实渠道投递能力升级。

## 影响范围

- 影响代码：
  - `apps/api/src/modules/auth/**`
  - `apps/api/src/common/security/**`
  - `apps/api/src/common/observability/**`
  - `apps/api/src/modules/open-integration/**`
  - `apps/api/src/modules/uploads/**`
  - `apps/api/src/modules/notification-center/**`
  - `apps/api/src/modules/system-governance/**`
  - `apps/api/prisma/schema.prisma`
  - `apps/main-web/src/auth/**`, `apps/oa-web/src/auth/**`, `apps/scrm-web/src/auth/**`
  - `apps/*/nginx.conf`
  - `docker-compose.yml`, `.github/workflows/ci.yml`, `docs/**`
- 影响接口：
  - `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/profile`
  - future `/api/auth/sessions`, `/api/auth/password-reset`, `/api/auth/mfa/**`
  - `/api/open-api/**`, `/api/open-integration/**`
  - `/api/uploads/**`, `/api/health`, `/api/metrics`, `/api/docs`
- 依赖与系统：
  - May require Redis or equivalent queue/cache/rate-limit storage.
  - May require argon2/bcrypt or a keyed HMAC/encryption utility plus migration support.
  - May require ClamAV or object-storage malware scanning integration.
  - May require SMTP/enterprise IM providers, backup storage and APM/log aggregation configuration.
