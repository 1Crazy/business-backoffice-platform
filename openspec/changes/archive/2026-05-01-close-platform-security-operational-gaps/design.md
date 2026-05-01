## 背景

仓库已经完成过第一批安全加固：JWT 密钥校验、登录/刷新限流、API 侧 HttpOnly refresh cookie 支持、身份连接器登录证明校验、上传内容校验、公开 `/api/health` 端点，以及若干高风险路径的安全回归测试。当前剩余问题主要是跨模块的生产化闭环缺口，而不是某个单一 controller 的局部 bug。

优先级最高的问题是三个前端应用仍然把 `platform-refresh-token` 持久化在 `localStorage`，并在刷新请求体中提交它。这绕过了 API 已经提供的 cookie 安全路径，使一次 XSS 注入几乎等价于长期会话泄露。同时，access token 仍然有 12 小时有效期，refresh token 刷新时不轮换，风险限流仍是进程内计数，生产运维也缺少请求关联、结构化日志、完整容器编排和备份恢复指引。

## 目标 / 非目标

**目标：**
- 移除 `main-web`、`oa-web` 和 `scrm-web` 中浏览器可读存储里的 refresh token 持久化。
- 通过缩短默认 access token TTL，并在每次刷新时轮换 refresh token，降低令牌泄露后的攻击窗口。
- 在调整会话传输方式时，保持 qiankun 主应用和子应用的现有登录续期体验。
- 让风险限流存储可替换，并在近生产或生产部署中要求使用共享后端。
- 在不重构整套 API 平台的前提下，补齐请求 ID 传递、结构化日志和基础指标/健康检查面。
- 为所有前端应用提供近生产 Docker 编排，并补齐备份、恢复和优雅关闭运行手册。
- 在资源创建入口强制执行租户配额，而不是只在报表页面展示用量。

**非目标：**
- 本 change 不建设完整 SIEM、链路追踪后端或 Prometheus 部署。
- 本 change 不实现完整 MFA、密码重置或 API 版本化；这些属于独立的产品/API 生命周期能力。
- 本 change 不把现有 JWT 会话模型替换为不透明 access token。
- 除非实施任务明确论证并记录，否则不新增依赖。

## 技术决策

### 1. 刷新流程以 cookie 为准，并移除 localStorage 兼容依赖

前端刷新请求使用 `withCredentials` 调用 `/auth/refresh`，不再在请求体中携带 refresh token。`storeSession` 和 auth store 只保留 access token 与会话过期时间；如需兼容页面刷新，可以继续把 access token/过期时间放在内存或 `localStorage`，但 `clearStoredSession` 必须清理历史遗留的 `platform-refresh-token`。

拒绝的替代方案：继续把 refresh token 放在 `localStorage`，只依赖 CSP。CSP 能降低部分 XSS 利用路径，但一旦页面出现任意脚本执行，浏览器可读令牌仍然可以被直接窃取。

### 2. 轮换 refresh token 并检测重放

`AuthService.refresh` 应签发新的 refresh token，哈希后替换当前会话的 token hash，并重新设置 cookie。若轮换后的旧 refresh token 再次被使用，服务应撤销会话或拒绝请求，并记录可审计的安全事件。退出登录继续保持现有语义：清除 cookie 并撤销当前会话。

拒绝的替代方案：refresh token 在会话过期前保持不变。该方案兼容性较好，但如果 token 曾经从 `localStorage` 被复制，就无法降低重放风险。

### 3. access token 使用可配置短 TTL 和安全默认值

默认 access token TTL 应从 12 小时调整到 15-30 分钟范围，并通过 `JWT_ACCESS_TOKEN_TTL` 一类环境变量控制。测试需要覆盖默认值与配置解析。refresh token 仍可保持较长有效期，但只能放在 HttpOnly cookie 中，并配合轮换。

拒绝的替代方案：立即使用 5 分钟 TTL。该方案更安全，但在前端刷新链路迁移期间会制造不必要的刷新压力和隐藏兼容性问题。

### 4. 风险限流引入存储接口

引入 `RiskThrottleStore` 边界：本地/测试环境可以使用内存实现，生产环境使用共享存储实现。Redis 是自然候选，但如果仓库当前更重视避免新增依赖，实施阶段也可以选择轻量数据库计数实现。若多实例部署仍选择内存限流，生产配置必须 fail fast 或给出强告警。

拒绝的替代方案：保留 `Map` 实现，仅在文档里说明限制。文档不能阻止攻击者把暴力尝试分散到多个副本来绕过限流。

### 5. 可观测性先做请求关联，再扩展完整 tracing

新增中间件接收或生成 `X-Request-Id`，将其挂到请求上下文和响应头，并保证日志包含请求 ID、method、path、status、duration、可用的用户/租户信息和错误类型。指标可以先通过基础端点或适配器暴露 uptime、build/version、请求计数、错误计数等；OpenTelemetry 等完整 tracing 可在确定 collector 后再扩展。

拒绝的替代方案：立即接入 OpenTelemetry。没有 collector 和部署路径时，完整 tracing 会先增加复杂度，团队却未必能使用这些数据。

### 6. 租户配额在写入边界强制执行

用户配额应在员工/用户创建或启用路径执行。存储配额应在上传创建前执行，校验当前用量加本次文件大小。月度任务配额应在批量任务创建或调度入口执行。每次拒绝都需要返回明确原因，并记录足够审计上下文，方便租户运营解释。

拒绝的替代方案：只通过 UI 禁用按钮执行配额。API 调用方和旧客户端会绕过该限制。

### 7. 生产交付物覆盖完整微前端形态

Docker 编排应包含 `main-web`、`oa-web`、`scrm-web`、API 和基础设施依赖，并显式声明环境变量。前端安全响应头更适合由静态服务器或反向代理镜像负责；Vite 开发服务器默认只暴露本机，局域网访问必须显式开启。

拒绝的替代方案：Compose 中继续只保留 `scrm-web`。这已经不能代表 qiankun 的生产拓扑，也无法验证主应用和子应用集成。

## 风险 / 权衡

- [风险] Cookie domain 和 SameSite 配置可能破坏本地跨端口 qiankun 刷新流程。缓解：本地 compose 保持同站点访问，补充 cookie domain 环境变量文档，并为主应用 + 子应用刷新增加集成测试或手动验证。
- [风险] 短 access token TTL 会暴露隐藏的刷新循环问题。缓解：补充并发 401 处理测试，并对所有前端应用执行登录、空闲、刷新手动检查。
- [风险] refresh token 轮换可能在多标签页并发刷新时误伤用户。缓解：在前端 HTTP client 中串行化刷新；如确需短暂宽限窗口，必须明确实现并测试。
- [风险] 共享限流存储可能要求 Redis 依赖和部署改造。缓解：通过 `RiskThrottleStore` 隔离实现，本地保留内存实现，并明确生产要求。
- [风险] 配额检查在并发写入下可能出现竞争。缓解：优先使用事务检查；如果仍有残留竞争，需要在任务和文档中记录，后续再引入更强账户化用量模型。

## 迁移计划

1. 后端支持短 TTL 配置、refresh token 轮换、cookie-only refresh，并明确是否临时兼容或直接拒绝请求体 refresh token。
2. 更新所有前端应用，停止存储和提交 refresh token，然后移除期望 `platform-refresh-token` 的旧测试。
3. 增加风险限流存储抽象和生产配置校验。
4. 增加请求 ID、结构化日志、优雅关闭和可观测性端点。
5. 在用户、上传和任务创建路径增加配额强制执行。
6. 扩展 Docker 和文档，覆盖 `main-web`、`oa-web`、`scrm-web`、API、备份和恢复。
7. 运行后端测试、前端单元测试，并执行一次手动 compose smoke，覆盖登录、刷新、子应用导航、上传和健康检查。

回滚策略：如迁移期确实需要，可短期保留一个接受 legacy refresh body 的特性开关。只有 API 仍接受旧请求体时，才允许先回滚前端；最终移除兼容后，回滚必须同时回退 API 和前端会话变更。

## 待定问题

- 本仓库应标准化哪种共享限流后端：Redis 还是数据库计数？
- access token 是否继续保留在 `localStorage` 以兼容页面刷新，还是改为纯内存并在启动时通过 cookie 刷新恢复？
- 生产环境的全局 CSP 头由谁负责：前端 Nginx 镜像、API gateway，还是外部反向代理？
