## 1. 回归测试与证据锁定

- [x] 1.1 补充 API 认证测试，证明刷新接口拒绝请求体 `refreshToken` fallback，且浏览器响应不暴露可持久化的 access token 或 refresh token 明文。
- [x] 1.2 补充 `main-web`、`oa-web` 和 `scrm-web` 前端测试，证明 access token 不会写入 `localStorage` 或 `sessionStorage`。
- [x] 1.3 补充 CSRF 测试，覆盖合法 token、缺失 token、非法 token 以及 Open API 豁免路径。
- [x] 1.4 补充开放集成测试，覆盖新 secret 存储版本、旧 SHA-256 迁移行为以及加密 Webhook signing secret 的使用。
- [x] 1.5 补充 CSP 和 nginx 配置检查，识别生产环境不安全指令、缺失安全响应头和未登记脚本来源。
- [x] 1.6 补充队列/worker 测试，覆盖 Webhook 投递、外部通知投递、批任务执行和 SchedulerJob 执行状态。
- [x] 1.7 补充上传扫描测试，覆盖干净文件、恶意文件、生产模式扫描器不可用以及本地 fail-open 模式。
- [x] 1.8 补充运行手册脚本测试或 smoke 检查，覆盖备份、恢复校验、附件一致性、Swagger 保护和生产 compose 端口暴露。

## 2. P0 会话与凭证加固

- [x] 2.1 重构认证响应和前端 HTTP client，使浏览器 access token 由 cookie/BFF 保护或仅保存在内存中，不再持久化到浏览器脚本可读存储。
- [x] 2.2 移除 `/api/auth/refresh` 对 `RefreshTokenDto.refreshToken` 的兼容支持，并拒绝请求体提交的 refresh token。
- [x] 2.3 为 cookie-auth 的刷新、退出和非幂等受保护 API 请求实现 CSRF token 签发与校验。
- [x] 2.4 为当前用户和授权管理员增加会话列表与会话撤销 API。
- [x] 2.5 为 Open API 凭证增加 hash 版本字段，并将新凭证迁移到慢哈希或带密钥的强哈希存储。
- [x] 2.6 加密存储 Webhook signing secret 和必须回读用于外部签名或 provider 调用的身份连接器 secret。
- [x] 2.7 为既有 SHA-256 凭证记录提供迁移路径，包括强制轮换或成功使用后升级。

## 3. P1 运行时安全控制

- [x] 3.1 为普通 CRUD/list 接口、高成本导出、上传和租户级流量增加全局分层 API 限流。
- [x] 3.2 收紧所有前端 nginx 配置的生产 CSP，同时保留已文档化的 qiankun 兼容能力。
- [x] 3.3 将本地开发 CSP 例外与生产/近生产 nginx 行为拆开。
- [x] 3.4 移除生产 compose 中 PostgreSQL 默认宿主机端口暴露，并把本地端口映射迁移到显式开发 override 或文档。
- [x] 3.5 在非本地环境通过 basic auth、IP allowlist、反向代理鉴权或启动拒绝保护 Swagger。
- [x] 3.6 用安全占位符替换 `.env.example` 中的高风险默认值，并对复制到生产的默认值执行启动拒绝。

## 4. 异步投递、调度与缓存

- [x] 4.1 引入队列/worker 抽象，首个实现使用 PostgreSQL-backed worker，或采用有文档说明的 Redis/BullMQ 实现。
- [x] 4.2 将 Webhook 测试和事件投递迁移为异步任务，并支持重试、超时、状态和投递历史。
- [x] 4.3 将外部通知投递迁移到 worker 执行，并防止生产环境把 mock 适配器结果记为真实 provider 成功。
- [x] 4.4 实现真实的 SchedulerJob runner，消费已启用任务、记录执行结果并更新下一次运行时间。
- [x] 4.5 为权限、数据范围、菜单和租户配置增加受控缓存边界，并在治理配置变更时失效缓存。

## 5. 上传、数据保护与合规

- [x] 5.1 在上传流程中接入恶意内容扫描，并支持生产环境可配置的 fail-closed 行为。
- [x] 5.2 增加附件扫描状态和隔离处理，确保不安全文件不能被下载或预览。
- [x] 5.3 为用户、客户、线索、联系人、审计日志和导出结果定义默认 PII 字段分类。
- [x] 5.4 在角色字段规则暴露敏感字段明文前，先应用默认 PII 脱敏策略。
- [x] 5.5 为审计日志、通知、Webhook delivery、已撤销会话、临时文件、失败明细和过期任务结果实现保留清理任务。
- [x] 5.6 增加个人数据导出和删除/匿名化流程，并覆盖审计、限流和法定留存保护。

## 6. 运维与可观测性生产化

- [x] 6.1 扩展健康检查，覆盖已启用的队列、缓存、对象/上传存储和扫描器依赖，同时不泄露连接细节。
- [x] 6.2 增加生产日志/APM 配置入口，同时保留适合容器的结构化 stdout 输出。
- [x] 6.3 增加自动备份脚本或定时任务，包含备份元数据、校验和以及独立存储目标配置。
- [x] 6.4 增加恢复演练文档和可执行 smoke，覆盖健康检查、登录、附件下载和代表性业务读取。
- [x] 6.5 增加附件/数据库一致性检查器，报告缺失对象和建议修复方式。
- [x] 6.6 文档化 API 版本化规则，并标记当前接口属于内部、外部还是版本稳定契约。

## 7. 认证能力规划项

- [x] 7.1 实现 MFA 绑定、验证、恢复码和敏感角色强制启用策略。
- [x] 7.2 实现密码重置申请、重置 token 校验、密码更新和重放防护。
- [x] 7.3 在多次触发临时登录锁定后，实现可配置的永久锁定或管理员审核流程。
- [x] 7.4 为密码创建和重置路径增加密码历史检查和更强密码策略校验。

## 8. 验证与发布

- [x] 8.1 运行 `openspec status --change remediate-residual-security-and-production-risks`，并修复 artifact 或 schema 问题。
- [x] 8.2 运行 API lint、typecheck 和测试套件。
- [x] 8.3 运行 `main-web`、`oa-web` 和 `scrm-web` 的前端 lint、typecheck 和测试套件。
- [x] 8.4 运行等价于完整仓库 CI 的 `pnpm lint`、`pnpm test` 和 `pnpm build`。
- [x] 8.5 运行近生产 Docker smoke，覆盖登录、刷新、CSRF、子应用加载、上传扫描、Webhook 入队、健康检查、指标和 Swagger 保护。
- [x] 8.6 在归档 change 前记录验证证据、剩余风险、发布开关和回滚路径。
