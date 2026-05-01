## Context

当前系统已经有全局 JWT 守卫、权限守卫、租户过滤和上传访问校验，但若干入口仍保留开发态或演示态实现。最危险的是 `OpenIntegrationController.loginWithIdentityConnector` 标记为 `@Public()`，服务层直接用请求体中的身份字段查找用户并调用 `AuthService.loginWithUser` 签发会话。

同时，`JwtStrategy` 对 `JWT_SECRET` 使用默认回退值，`.env.example` 也给出同一弱默认；登录入口只审计失败原因，没有限流或锁定；三个前端都把 access token 与 refresh token 写入 `localStorage`；上传校验依赖 `file.mimetype`，Swagger 和 CORS 默认对本地开发友好但不适合生产。

## Goals / Non-Goals

**Goals:**
- 让身份连接器登录只能接受服务端可验证的可信身份断言。
- 让弱 `JWT_SECRET`、默认 Swagger/CORS 暴露、默认管理员账号进入非本地环境时直接失败或不可用。
- 让登录、刷新、Open API 凭证和连接器入口具备失败限流、审计和测试覆盖。
- 让上传链路在服务端验证文件内容，并降低内存、预览和响应头风险。
- 给认证、开放集成和上传模块补齐高风险回归测试。

**Non-Goals:**
- 不重做完整 IAM/SSO 平台。
- 不引入新第三方依赖，除非后续实施阶段明确批准。
- 不改变现有角色权限模型和租户数据模型。
- 不在本 change 中重做全部前端视觉体验。

## Decisions

### 1. 身份连接器登录必须验证外部证明

连接器登录不再接受裸 `email/username/subject` 作为登录凭据。实现时应至少选择一种可验证方式：

- OAuth/OIDC 授权码或 ID token 校验，校验 issuer、audience、subject、email 和签名。
- 企业 IdP 回调签名，使用连接器级 secret 对请求体、时间戳和 nonce 做 HMAC 校验。
- 本地开发专用 mock connector，仅在 `NODE_ENV !== "production"` 且显式配置时启用。

验收标准：伪造请求体但无有效证明时，接口必须返回 401/403，且不会创建会话或 identity binding。

### 2. 启动配置必须 fail fast

后端启动时校验 `JWT_SECRET`、CORS origins、Swagger 开关和种子账号策略。`JWT_SECRET` 为空、为模板值或长度/熵明显不足时必须拒绝启动。Swagger 在非本地环境默认关闭，CORS 不再使用 `origin: true` 的宽松策略。

验收标准：测试能覆盖默认密钥启动失败；本地仍可通过 `.env.example` 明确替换占位值后启动。

### 3. 失败限流放在入口边界，审计保留业务上下文

账号密码登录、刷新令牌、连接器登录、Open API 凭证校验都要基于账号、IP、租户/连接器/AccessKey 维度做失败计数。短期优先使用数据库或内存内置实现，避免新增依赖；生产化可后续切换 Redis。

验收标准：连续失败达到阈值后短时间内被拒绝；成功登录后清理对应失败计数；审计日志保留失败原因但不泄露密钥。

### 4. Refresh token 存储迁移采用兼容过渡

现有前端依赖 `localStorage` 在主应用和子应用之间共享会话。实施时分两步：先缩短 access token 生命周期、增加刷新入口限流和安全审计；再将 refresh token 迁移到 `HttpOnly; Secure; SameSite` cookie，并通过 API base domain 与 qiankun 子应用验证兼容性。

验收标准：迁移前后的主应用、OA、SCRM 登录续期行为都有测试或手动验证记录；失败时统一清理会话并回到主应用登录页。

### 5. 上传以服务端内容校验为准

上传服务不能只信任 `file.mimetype`。实现时应对允许类型做最小 magic bytes / 内容头校验，规范化原始文件名，限制预览 MIME，下载统一 `attachment`，预览统一 `nosniff` 与 CSP。内存存储需要配合较小阈值或临时文件/流式存储策略，避免并发大文件挤压进程内存。

验收标准：伪造 MIME 的文件被拒绝；不支持预览的类型不能走 inline 预览；下载和预览响应头符合预期。

## Risks / Trade-offs

- [Risk] 收紧连接器登录会影响当前演示登录能力。Mitigation: 保留本地 mock connector，但必须显式启用且生产禁用。
- [Risk] Refresh token 从 `localStorage` 迁移到 cookie 会影响微前端跨端口联调。Mitigation: 分阶段实施，先补入口限流和审计，再调整 cookie 域与本地代理。
- [Risk] 无新依赖的限流能力在多实例部署下不够精确。Mitigation: 当前 change 先建立接口与测试，后续可替换为 Redis 存储实现。
- [Risk] 文件内容校验对部分历史上传或边缘格式更严格。Mitigation: 从允许列表中的主流类型开始，保留明确错误信息。
