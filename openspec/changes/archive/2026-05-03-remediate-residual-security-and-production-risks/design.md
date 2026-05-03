## 背景

当前仓库已经完成一批基础加固：refresh token 通过 `HttpOnly` cookie 下发、旧 localStorage refresh token 会被清理、风险限流支持数据库共享 store、API 会生成/回写 `X-Request-Id`、健康检查会探测数据库、上传会做 MIME 与内容头一致性校验，CI 也已运行 lint/test/build。

残留风险集中在更深的生产安全边界：access token 仍持久化在 localStorage；refresh 接口仍保留请求体 fallback；cookie 参与刷新但未建立 CSRF 机制；开放平台 secret 使用单次 SHA-256 或明文；qiankun 生产 CSP 过宽；普通业务接口没有统一限流；Webhook、通知和调度仍偏同步或模拟；备份、保留、PII 与合规能力仍以手册或角色配置为主。

## 目标与非目标

**目标：**

- 消除浏览器可持久化令牌和 refresh 请求体明文兼容入口。
- 建立 cookie 认证/刷新后的 CSRF 边界和全局 API 限流基线。
- 迁移开放平台凭证和签名密钥存储，避免快速哈希或可读明文成为长期风险。
- 把同步外部投递和未落地调度迁移到可治理 worker 模型。
- 补齐生产运维自动化、数据保护和外部通知真实适配器的规格与任务。

**非目标：**

- 不在本变更中交付数据库主从、读写分离或跨可用区高可用拓扑；这应由部署平台和数据库运维方案单独规划。
- 不在本变更中一次性完成完整 GDPR/个保法认证，只交付产品侧基础能力：导出、删除/匿名化、保留清理和处理记录。
- 不强制立即引入 Redis；队列、缓存和限流共享存储可以复用 PostgreSQL 起步，但设计必须保留可替换边界。
- 不把 Swagger 文档全部迁移到公网可用方案；默认仍应非生产公开、本地开发可用。

## 技术决策

1. 会话令牌采用“cookie-first + CSRF”路线，而不是继续扩展 localStorage 令牌。
   - 理由：localStorage 中的 access token 会放大 XSS 后果；cookie-only/BFF 或内存短令牌可以缩小可窃取面。
   - 拒绝方案：只缩短 access token TTL。TTL 能降低窗口，但不能解决 XSS 直接读 token 的问题。

2. Refresh 请求体 fallback 移除，而不是保留迁移期无限兼容。
   - 理由：当前 DTO 明确写着“兼容迁移期”，长期保留会与 cookie-only 文档和安全模型冲突。
   - 拒绝方案：继续优先 cookie、body 兜底。该方案无法证明前端脚本不需要读取 refresh token。

3. CSRF 采用双提交 token 或服务端会话绑定 token，覆盖所有 cookie-auth 写操作。
   - 理由：`sameSite=lax` 能降低部分跨站风险，但不能替代状态变更接口的显式 CSRF 校验。
   - 拒绝方案：仅依赖 CORS。CORS 不是 CSRF 防护机制，且无法覆盖所有浏览器自动带 cookie 场景。

4. Secret 存储拆分为两类：不可回读凭证用慢哈希/peppered hash，可回读签名密钥用应用级加密。
   - 理由：Open API secret、OAuth client secret 可不可逆校验；Webhook signing secret 需要用于签名，必须可解密但不能明文落库。
   - 拒绝方案：全部 argon2。Webhook signing secret 无法用不可逆哈希完成后续签名。

5. 队列/调度使用模块内抽象，第一实现可以是 PostgreSQL-backed worker。
   - 理由：当前仓库没有 Redis，直接新增 Redis 会扩大运维面；但任务模型必须可迁移到 BullMQ/Redis。
   - 拒绝方案：继续同步执行 Webhook/通知。外部端点慢响应会拖住请求线程并放大故障影响。

6. CSP 分环境收紧。
   - 理由：qiankun 开发期可能需要 `unsafe-eval`，生产期应通过构建产物、nonce/hash 和固定子应用来源缩小范围。
   - 拒绝方案：一个 nginx.conf 同时覆盖开发和生产。它会把开发便利永久带入生产。

## 风险与权衡

- [Risk] Cookie-only access token 会影响现有前端 HTTP client 和子应用共享登录态。 → 分阶段迁移：先支持 cookie-auth API，再移除 localStorage token，并用主/子应用 smoke 验证。
- [Risk] CSRF token 可能破坏第三方 Open API 调用。 → 只对浏览器 cookie-auth 路径强制 CSRF；Open API 继续使用显式凭证和签名。
- [Risk] Secret 迁移后旧凭证无法验证。 → 增加 `secretHashVersion` / `secretCiphertextVersion`，登录或轮换时升级，必要时要求管理员重新生成 secret。
- [Risk] 队列 worker 引入最终一致性。 → 对外部投递返回“已入队”状态，后台展示 delivery/job 状态和重试结果。
- [Risk] 病毒扫描不可用会阻塞上传。 → 提供 fail-closed 生产模式和 fail-open 本地模式，生产默认拒绝未扫描文件。
- [Risk] CSP 收紧可能阻断 qiankun 子应用。 → 用 Playwright/HTTP smoke 检查主应用加载、子应用资源、API 请求和控制台 CSP 报错。

## 迁移计划

1. 先补回归测试：auth refresh body fallback、localStorage access token、CSRF、secret 校验、CSP、队列投递、上传扫描和运维脚本。
2. 增加后端 cookie-auth/CSRF 能力，保留短期 feature flag 观察，不改变 Open API 鉴权。
3. 改造前端三端 HTTP client，停止持久化 access token，刷新流程只依赖 cookie。
4. 增加 secret 新字段和迁移逻辑，旧 SHA-256 凭证进入轮换/兼容窗口。
5. 引入队列/worker 抽象，先迁移 Webhook 测试投递、通知外部渠道和调度任务。
6. 收紧 nginx/CSP、compose、Swagger 和 `.env.example`，补充自动化备份与一致性校验脚本。
7. 运行 lint/test/build、OpenSpec 校验、Docker smoke 和安全路径手动验证。

回滚：保留可回滚 feature flag 仅用于 cookie-auth 和队列 worker 的灰度切换；secret 字段迁移采用 additive schema，回滚代码前不得删除旧字段。移除 refresh body fallback 和 localStorage access token 属安全 breaking change，回滚需同步恢复前端旧逻辑和后端 DTO，默认不建议。

## 待确认问题

- Access token 最终形态采用纯 HttpOnly cookie 还是 BFF session cookie，需要根据部署域名、子应用跨源方式和移动端需求确认。
- 队列首选 PostgreSQL-backed worker 还是直接 Redis/BullMQ，取决于生产基础设施是否已有 Redis。
- 病毒扫描接 ClamAV、本地 sidecar 还是对象存储事件扫描，需要由部署环境能力决定。
- 外部通知首批真实适配器优先 SMTP、企业微信、钉钉还是飞书，需要产品和客户环境确认。
