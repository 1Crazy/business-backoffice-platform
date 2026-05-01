## 1. 回归测试与迁移护栏

- [x] 1.1 为 API 认证模块补充测试，锁定短 access token TTL 配置、cookie-only refresh、refresh token 轮换、旧 token 重放拒绝和 logout 清 cookie 行为。
- [x] 1.2 为 `main-web`、`oa-web`、`scrm-web` 补充或更新 auth/session/http 测试，证明前端不再读取、存储或提交 `platform-refresh-token`。
- [x] 1.3 为风险限流补充跨 store 行为测试，覆盖内存实现、共享实现契约、失败计数、锁定窗口和成功后清理。
- [x] 1.4 为租户配额补充后端单元测试，覆盖用户数、附件存储、月度任务超额拒绝和租户范围统计。
- [x] 1.5 为请求 ID、结构化日志、健康/指标端点和优雅关闭补充最小自动化测试或可重复 smoke 脚本。

## 2. 认证与会话安全

- [x] 2.1 将 access token TTL 改为环境变量驱动，并把默认值调整为不超过 30 分钟。
- [x] 2.2 重构 `AuthService.refresh`，使用 refresh cookie 完成续期并在每次刷新时轮换 refresh token hash。
- [x] 2.3 增加 refresh token 重放检测与审计，旧 token 再次使用时拒绝刷新并按安全事件记录。
- [x] 2.4 调整 `AuthController` 登录、刷新和退出响应，确保 refresh token 只通过 `HttpOnly` cookie 下发或清理。
- [x] 2.5 收紧登录密码 DTO/策略到至少 8 位且包含字母和数字，并更新相关测试数据。

## 3. 前端会话迁移

- [x] 3.1 更新 `apps/main-web/src/auth/session.ts`、store 和 HTTP client，移除 refresh token 存储与请求体提交，刷新请求启用 credentials。
- [x] 3.2 更新 `apps/oa-web/src/auth/session.ts`、store 和 HTTP client，保持与主应用一致的 cookie-first 刷新行为。
- [x] 3.3 更新 `apps/scrm-web/src/auth/session.ts`、store 和 HTTP client，保持与主应用一致的 cookie-first 刷新行为。
- [x] 3.4 清理所有前端测试中对 `platform-refresh-token` 的成功路径断言，保留 legacy key 清理断言。
- [x] 3.5 手动验证主应用登录、子应用切换、access token 过期后刷新和退出登录链路。

## 4. 风险限流与开放集成边界

- [x] 4.1 抽象 `RiskThrottleStore`，将当前 `Map` 计数实现迁移为本地/测试内存 store。
- [x] 4.2 实现生产可用的共享限流 store，优先选择 Redis；如选择数据库实现，需在设计或任务备注中记录理由。备注：本轮选择数据库共享 store，复用现有 PostgreSQL/Prisma 基础设施，避免在当前 change 中新增 Redis 运维依赖。
- [x] 4.3 增加生产配置校验，多实例或生产环境不得静默使用进程内限流。
- [x] 4.4 将登录、刷新、Open API 凭证校验和连接器风险入口统一接入新的限流 store。
- [x] 4.5 为 Webhook 增加租户级或环境级目标域名 allowlist，并在真实投递测试前执行校验。

## 5. 可观测性与运行安全

- [x] 5.1 增加请求 ID 中间件，支持接收或生成 `X-Request-Id`，并写回响应头。
- [x] 5.2 增加结构化访问日志和错误日志，字段包含请求 ID、method、path、status、duration、用户和租户上下文。
- [x] 5.3 对日志中的密码、refresh token、cookie、API secret 等敏感字段执行脱敏或禁止记录。
- [x] 5.4 扩展健康检查，区分进程存活和关键依赖状态，并补充可控的基础指标端点。
- [x] 5.5 在 Nest 应用入口启用优雅关闭 hooks，并确保 Prisma 或其他关键资源在退出前关闭。

## 6. 租户配额强制执行

- [x] 6.1 在员工创建或启用路径强制校验 `userQuota`，超过配额时拒绝并记录审计。
- [x] 6.2 在附件上传写入前校验 `storageQuotaMb`，拒绝会超额的上传且不得产生物理文件或附件记录。
- [x] 6.3 在批量任务或调度任务创建入口校验 `monthlyTaskQuota`，超过配额时拒绝创建。
- [x] 6.4 复用或新增租户用量查询能力，确保所有配额统计只计算当前租户资源。
- [x] 6.5 更新租户运营页面或 API 错误处理，让配额拒绝信息可被管理员理解。

## 7. Docker、前端安全头与运维手册

- [x] 7.1 为 `main-web` 和 `oa-web` 补齐 Dockerfile 或等价构建入口，并复核 `scrm-web` 构建配置。
- [x] 7.2 扩展 `docker-compose.yml`，加入 `main-web`、`oa-web`、`scrm-web`、API 和必要基础设施的近生产联调拓扑。
- [x] 7.3 为前端静态服务或反向代理配置 CSP、`X-Content-Type-Options`、`Referrer-Policy` 等安全响应头。
- [x] 7.4 调整各前端 Vite 配置，使默认开发服务器只监听本机，局域网联调通过显式脚本或环境变量启用。
- [x] 7.5 增加数据库备份、恢复演练、上传文件一致性和生产环境变量说明文档。

## 8. 验证与交付

- [x] 8.1 运行 `pnpm --filter platform-api lint` 和 `pnpm --filter platform-api test`。
- [x] 8.2 运行 `pnpm --filter main-web test`、`pnpm --filter oa-web test` 和 `pnpm --filter scrm-web test`，如脚本名不同则记录实际命令。
- [x] 8.3 运行架构或类型检查脚本，确认前后端边界和类型未回退。
- [x] 8.4 启动近生产 Docker 编排，执行登录、刷新、子应用加载、上传、配额拒绝、健康检查和请求 ID smoke。
- [x] 8.5 更新 change verification 记录，列出已验证项、未验证项、剩余风险和回滚路径。
