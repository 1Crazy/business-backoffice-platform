## MODIFIED Requirements

### Requirement: 管理员可以登录管理后台
系统 SHALL 允许处于启用状态的员工账号通过账号标识和密码登录管理后台，并在登录成功后建立受保护会话、返回该员工的基础资料以及当前会话过期信息。系统 SHALL 通过 `HttpOnly` cookie 或等价 BFF 会话机制保护浏览器认证状态，前端脚本 MUST NOT 读取、持久化或通过请求体提交 access token 或 refresh token。系统 SHALL 拒绝无效账号、错误密码、弱密码策略不满足、已停用账号或所属租户不可用账号的登录请求。系统 MUST 对连续失败登录执行限流、锁定窗口和安全审计，避免账号被暴力破解。

#### Scenario: 登录成功
- **WHEN** 启用状态的员工提交正确的账号标识和密码
- **THEN** 系统建立受保护会话并返回该员工的基础资料以及当前会话的过期信息
- **AND** 浏览器认证材料通过 `HttpOnly` cookie 或等价 BFF 机制保护
- **AND** 响应体不包含可被前端持久化的 access token 或 refresh token 明文
- **AND** 系统清理该账号对应的失败登录计数

#### Scenario: 停用账号被拒绝登录
- **WHEN** 已停用员工提交正确的登录凭证
- **THEN** 系统拒绝访问并提示该账号当前不可用

#### Scenario: 连续登录失败触发限流
- **WHEN** 同一账号、IP 或等价风险维度在短时间内连续提交错误登录凭证并达到阈值
- **THEN** 系统在锁定窗口内拒绝继续尝试
- **AND** 系统记录不包含明文密码或密钥的安全审计日志

#### Scenario: 密码不满足基础复杂度
- **WHEN** 用户提交少于 8 位或缺少字母数字组合的密码用于登录或后续密码设置入口
- **THEN** 系统拒绝该请求并返回密码策略错误

### Requirement: 系统支持后台会话治理
系统 SHALL 支持已登录员工刷新访问能力、主动退出当前会话，并在账号被停用、会话被撤销或刷新令牌重放后拒绝该会话继续访问受保护接口。访问令牌签发 MUST 使用显式配置的强 `JWT_SECRET`；当密钥为空、为模板默认值或不满足安全基线时，系统 MUST 拒绝启动。浏览器刷新入口 MUST 仅依赖 `HttpOnly` cookie、执行令牌轮换、具备失败限流和审计能力，并且 MUST NOT 接受请求体中的 refresh token fallback。管理员和用户 SHALL 能查看并撤销活跃会话。

#### Scenario: 使用 cookie 刷新访问能力
- **WHEN** 已登录员工携带有效刷新 cookie 请求续期
- **THEN** 系统返回新的访问能力或延长受保护会话
- **AND** 系统轮换刷新令牌并重新设置 `HttpOnly` cookie

#### Scenario: 请求体提交刷新令牌
- **WHEN** 前端或第三方调用方在刷新请求体中提交刷新令牌
- **THEN** 系统拒绝或忽略该明文刷新令牌
- **AND** 系统不得要求浏览器脚本读取刷新令牌才能完成续期

#### Scenario: 主动退出当前会话
- **WHEN** 已登录员工请求退出当前会话
- **THEN** 系统撤销该会话对应的刷新能力
- **AND** 系统清除刷新令牌 cookie
- **AND** 系统拒绝该会话后续继续刷新访问令牌

#### Scenario: 已停用账号的活动会话失效
- **WHEN** 员工在登录后被管理员停用
- **THEN** 系统在该会话下一次访问受保护接口时拒绝访问

#### Scenario: 默认 JWT 密钥导致启动失败
- **WHEN** 后端以空密钥、模板默认密钥或弱密钥配置启动
- **THEN** 系统拒绝启动并输出可定位的配置错误

#### Scenario: 访问令牌不持久化到浏览器脚本存储
- **WHEN** 前端收到登录或刷新响应
- **THEN** 前端不会把 access token 写入 `localStorage`、`sessionStorage` 或其他可被脚本长期读取的持久化存储

#### Scenario: 刷新令牌连续失败触发限流
- **WHEN** 同一来源连续提交无效刷新请求并达到阈值
- **THEN** 系统在锁定窗口内拒绝刷新请求
- **AND** 系统记录安全审计日志

#### Scenario: 旧刷新令牌被重放
- **WHEN** 已轮换失效的刷新令牌再次被使用
- **THEN** 系统拒绝刷新请求
- **AND** 系统记录可排查的安全审计事件

#### Scenario: 用户撤销其他设备会话
- **WHEN** 用户或授权管理员撤销某个非当前设备的活跃会话
- **THEN** 系统使该会话后续访问和刷新失效
- **AND** 当前会话保持可用

## ADDED Requirements

### Requirement: Cookie 认证路径具备 CSRF 防护
系统 SHALL 对依赖浏览器自动携带 cookie 的认证、刷新和状态变更接口执行 CSRF 防护。CSRF token MUST 与当前会话或设备绑定，前端 MUST 在非幂等请求中提交该 token，服务端 MUST 拒绝缺失、过期或不匹配的 token。Open API 等显式凭证调用路径 MUST NOT 被浏览器 CSRF token 机制误拦截。

#### Scenario: 状态变更请求携带合法 CSRF token
- **WHEN** 已登录用户对受保护业务资源发起 POST、PATCH、PUT 或 DELETE 请求并携带合法 CSRF token
- **THEN** 系统继续执行原有鉴权和业务处理

#### Scenario: 状态变更请求缺少 CSRF token
- **WHEN** 浏览器 cookie-auth 请求对受保护业务资源发起非幂等操作但未提交 CSRF token
- **THEN** 系统拒绝该请求
- **AND** 系统记录可关联请求 ID 的安全事件

#### Scenario: Open API 请求不使用浏览器 cookie 会话
- **WHEN** 外部系统使用 Open API access key 和 secret 调用接口
- **THEN** 系统不要求该请求提交浏览器 CSRF token

### Requirement: 账号安全支持 MFA、密码重置和永久锁定
系统 SHALL 支持为员工账号配置多因素认证、密码重置流程和管理员可治理的账号锁定策略。连续失败登录达到安全阈值后，系统 MUST 支持临时限流和可配置的永久锁定或管理员审核流程。密码重置 MUST 使用一次性、短有效期、不可重放的重置凭证。

#### Scenario: 启用 MFA 的用户登录
- **WHEN** 已启用 MFA 的用户提交正确账号密码
- **THEN** 系统要求完成第二因素验证后才建立完整登录会话

#### Scenario: 用户请求密码重置
- **WHEN** 用户通过受支持身份标识请求重置密码
- **THEN** 系统生成短有效期重置凭证并通过已验证渠道发送
- **AND** 系统不会泄露该账号是否存在的细节

#### Scenario: 连续失败触发永久锁定审核
- **WHEN** 同一账号在策略窗口内多次触发临时登录锁定并达到永久锁定阈值
- **THEN** 系统锁定该账号或要求管理员审核后才能继续登录
