## Why

本次审查发现认证、开放集成和上传链路存在高风险缺口：公共身份连接器登录接口只接收普通身份字段就能换取平台会话，JWT 存在危险默认密钥，登录入口缺少限流，本地持久化刷新令牌扩大了 XSS 后果，上传类型校验主要依赖客户端 MIME，Swagger 与 CORS 默认策略也偏开发态。

这些问题集中在“入口认证”和“外部集成边界”，一旦进入测试、预发或生产环境，会直接影响租户数据安全和平台可信度。该 change 作为第一优先级安全修复包，目标是先把可被利用的入口堵住，再补齐回归测试和部署校验。

## What Changes

- 收紧身份连接器登录：公共登录入口必须验证可信外部断言、签名、授权码或等价证明，不能再信任请求体里的 `email/username/subject` 明文字段。
- 收紧 JWT 与会话配置：启动时拒绝默认或弱 `JWT_SECRET`，明确 access/refresh token 生命周期，并为前端令牌存储迁移到更安全的策略制定兼容路径。
- 增加登录与开放 API 防护：对账号密码登录、刷新令牌、连接器登录和 Open API 凭证校验增加失败计数、限流、审计和锁定策略。
- 加固上传链路：使用服务端文件内容校验、扩展名/文件名规范化、受控预览策略和更稳妥的存储处理方式。
- 收紧开发态暴露面：CORS、Swagger 文档和默认种子账号必须按环境显式启用或降权，不再以生产可用默认值存在。
- 为高风险入口补齐后端自动化测试，覆盖伪造登录、弱配置启动失败、暴力尝试、跨租户访问和伪装上传。

## Capabilities

### New Capabilities

- `security-hardening`: 平台启动、认证入口、外部集成和上传链路具备最小安全基线与自动化验证。

### Modified Capabilities

- `access-control`: 会话签发必须建立在已验证身份来源之上，登录失败与凭证验证失败必须可限流、可审计。
- `open-integration-platform`: 身份连接器登录、Open API 凭证和 Webhook 配置必须具备可验证的信任边界。
- `enterprise-delivery-foundation`: 上传、下载和预览必须在服务端执行文件类型、访问权限和响应头安全控制。
- `codebase-architecture`: 高风险配置不能依赖危险默认值，启动阶段必须 fail fast。

## Impact

- Affected code:
  - `apps/api/src/main.ts`
  - `apps/api/src/app.module.ts`
  - `apps/api/src/common/auth/**`
  - `apps/api/src/modules/auth/**`
  - `apps/api/src/modules/open-integration/**`
  - `apps/api/src/modules/uploads/**`
  - `apps/main-web/src/auth/**`
  - `apps/oa-web/src/auth/**`
  - `apps/scrm-web/src/auth/**`
  - `apps/*/.env.example`
- Affected APIs:
  - `/api/auth/login`
  - `/api/auth/refresh`
  - `/api/open-integration/connectors/:id/login`
  - `/api/open-api/**`
  - `/api/uploads/**`
  - `/docs`
- Affected risks:
  - forged connector login
  - weak JWT signing secret
  - brute-force login and credential guessing
  - token theft blast radius after XSS
  - disguised file upload and unsafe preview
  - production exposure of development CORS, Swagger, and seed defaults
