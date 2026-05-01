## ADDED Requirements

### Requirement: 平台请求具备可关联的请求追踪标识
系统 SHALL 为每个进入 API 的 HTTP 请求建立请求追踪标识。若调用方提供合法 `X-Request-Id`，系统 MUST 复用该值；否则系统 MUST 生成新的请求 ID。响应头、结构化日志和错误日志 MUST 带上同一请求 ID，使前端报错、后端日志和运维排查可以关联。

#### Scenario: 调用方提供请求 ID
- **WHEN** 客户端请求携带合法 `X-Request-Id`
- **THEN** API 响应头返回同一请求 ID
- **AND** 该请求产生的访问日志和错误日志包含同一请求 ID

#### Scenario: 调用方未提供请求 ID
- **WHEN** 客户端请求未携带 `X-Request-Id`
- **THEN** 系统生成一个新的请求 ID
- **AND** 响应头和该请求日志都包含生成的请求 ID

### Requirement: 平台输出结构化运行日志
系统 SHALL 输出结构化日志，用于记录请求完成、异常、认证失败、限流、配额拒绝和关键运维事件。日志 MUST 至少包含时间、级别、请求 ID、HTTP method、path、status、duration、错误类型以及可用的用户和租户上下文，且 MUST NOT 记录明文密码、refresh token、API secret 或 cookie 值。

#### Scenario: 受保护接口请求完成
- **WHEN** 已登录用户访问受保护 API 并完成响应
- **THEN** 系统输出结构化访问日志
- **AND** 日志包含请求 ID、租户、用户、路径、状态码和耗时

#### Scenario: 敏感凭证出现在请求中
- **WHEN** 登录、刷新或 Open API 凭证校验请求被记录
- **THEN** 日志不得包含明文密码、refresh token、API secret 或 cookie 值

### Requirement: 平台暴露基础健康和指标信号
系统 SHALL 提供可供容器和运维系统使用的健康检查与基础指标信号。健康检查 MUST 能区分进程存活和关键依赖可用性；指标信号 MUST 至少表达进程启动时间、版本信息、请求数量、错误数量和延迟摘要，且暴露策略 MUST 可通过环境变量控制。

#### Scenario: 容器执行健康检查
- **WHEN** 容器健康检查访问健康端点
- **THEN** 系统返回当前进程和关键依赖的健康状态
- **AND** 该端点不要求登录但不得泄露敏感配置

#### Scenario: 运维系统读取指标
- **WHEN** 指标暴露被显式启用
- **THEN** 系统提供基础运行指标
- **AND** 指标内容不包含用户隐私、令牌或业务敏感字段
