# open-integration-platform Specification

## Purpose
定义多租户开放平台的租户级 Open API、Webhook 与企业身份源接入能力边界，确保外部系统集成在租户隔离、凭证治理与运行审计下可控运行。
## Requirements
### Requirement: 平台提供租户级 Open API 与凭证治理
系统 SHALL 提供租户级 Open API 能力，并允许租户管理员或平台运营者管理 API 凭证、权限范围和密钥轮换。每个 API 凭证 MUST 明确绑定所属租户和可访问范围。Open API 凭证校验 MUST 使用不泄露密钥的比较方式，并对连续失败校验执行限流、审计和必要的临时拒绝。生产或多实例部署中的限流状态 MUST 使用跨实例共享存储，不能只依赖单进程内存计数。

#### Scenario: 租户管理员创建 API 凭证
- **WHEN** 租户管理员创建一个新的 Open API 凭证
- **THEN** 系统为该凭证绑定租户归属和访问范围，并支持后续轮换或撤销

#### Scenario: API 凭证访问超出范围的数据
- **WHEN** 某个凭证尝试访问不属于自身权限范围的数据
- **THEN** 系统拒绝该请求，并记录安全审计日志

#### Scenario: 连续错误凭证校验被限流
- **WHEN** 同一 AccessKey、租户或来源连续提交错误 Open API 密钥并达到阈值
- **THEN** 系统在锁定窗口内拒绝继续校验
- **AND** 审计日志不会记录明文密钥

#### Scenario: 多实例共享限流状态
- **WHEN** 同一凭证或来源的失败请求分散命中多个 API 实例
- **THEN** 系统使用共享限流状态累计失败次数
- **AND** 达到阈值后所有实例都拒绝继续校验

### Requirement: 平台提供租户级 Webhook 事件回调
系统 SHALL 允许租户配置 Webhook 订阅，以接收审批、经营、回款、流程和系统治理等关键事件的回调。Webhook 订阅 MUST 具备签名校验、失败重试和投递记录。Webhook 端点配置和测试 MUST 明确区分真实投递与模拟结果，并在真实投递时限制协议、内网地址、超时、重定向和响应体长度。平台 MUST 支持按租户或环境配置 Webhook 目标域名 allowlist；启用 allowlist 后，不在允许范围内的目标域名 MUST 被拒绝。

#### Scenario: 租户订阅关键业务事件
- **WHEN** 租户管理员为某类事件配置 Webhook 回调地址
- **THEN** 系统在该类事件发生时向对应地址投递签名回调

#### Scenario: Webhook 投递失败
- **WHEN** 某次 Webhook 回调投递失败
- **THEN** 系统记录失败原因、执行重试并允许管理员查看投递历史

#### Scenario: 非法或内网 Webhook 地址被拒绝
- **WHEN** 租户管理员配置或测试一个不允许的协议、内网地址或本机地址
- **THEN** 系统拒绝该配置或测试请求
- **AND** 系统记录可排查但不泄露敏感网络信息的失败原因

#### Scenario: Webhook 目标域名不在 allowlist
- **WHEN** Webhook 域名 allowlist 已启用且租户配置不在允许范围内的目标域名
- **THEN** 系统拒绝保存或测试该 Webhook
- **AND** 返回可供管理员修正配置的错误信息

### Requirement: 平台支持企业身份源接入
系统 SHALL 支持以租户为单位接入企业身份源，包括 SSO、LDAP 或 OAuth 等方式，并允许企业在保留统一授权体系的前提下复用现有身份认证入口。身份源登录 MUST 基于服务端可验证的外部证明，例如 OIDC token、授权码或连接器级签名断言；系统 MUST NOT 仅凭请求体中的 `email`、`username` 或 `subject` 字段签发平台会话。

#### Scenario: 企业接入外部身份源登录
- **WHEN** 某租户启用企业身份源接入
- **THEN** 该租户用户可以通过外部身份源完成登录，并进入所属租户上下文

#### Scenario: 身份接入失败可被审计
- **WHEN** 外部身份源认证失败或配置异常
- **THEN** 系统记录对应失败事件，并允许平台或租户管理员查看排查线索

#### Scenario: 伪造连接器登录请求被拒绝
- **WHEN** 调用方只提交 `email`、`username` 或 `subject` 字段而没有有效外部证明
- **THEN** 系统拒绝登录
- **AND** 系统不会创建平台会话或身份绑定

#### Scenario: 本地 mock 连接器在生产环境不可用
- **WHEN** 生产环境收到使用 mock 连接器登录的请求
- **THEN** 系统拒绝该请求
- **AND** 审计日志标记该请求使用了禁用的开发态入口

