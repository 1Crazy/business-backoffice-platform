# open-integration-platform Specification

## Purpose
定义多租户开放平台的租户级 Open API、Webhook 与企业身份源接入能力边界，确保外部系统集成在租户隔离、凭证治理与运行审计下可控运行。
## Requirements
### Requirement: 平台提供租户级 Open API 与凭证治理
系统 SHALL 提供租户级 Open API 能力，并允许租户管理员或平台运营者管理 API 凭证、权限范围和密钥轮换。每个 API 凭证 MUST 明确绑定所属租户和可访问范围。Open API 凭证校验 MUST 使用不泄露密钥的比较方式，并对连续失败校验执行限流、审计和必要的临时拒绝。

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

### Requirement: 平台提供租户级 Webhook 事件回调
系统 SHALL 允许租户配置 Webhook 订阅，以接收审批、经营、回款、流程和系统治理等关键事件的回调。Webhook 订阅 MUST 具备签名校验、失败重试和投递记录。测试投递 MUST 返回具备真实语义的结果；若使用模拟模式，API 和 UI MUST 明确标记为模拟，不能让用户误认为外部端点已经真实收到请求。

#### Scenario: 租户订阅关键业务事件
- **WHEN** 租户管理员为某类事件配置 Webhook 回调地址
- **THEN** 系统在该类事件发生时向对应地址投递签名回调

#### Scenario: Webhook 投递失败
- **WHEN** 某次 Webhook 回调投递失败
- **THEN** 系统记录失败原因、执行重试并允许管理员查看投递历史

#### Scenario: 模拟测试明确标记模拟状态
- **WHEN** 系统以模拟方式生成 Webhook 测试结果
- **THEN** API 响应和页面展示明确标记该结果为模拟
- **AND** 页面不会把模拟结果展示成真实外部投递成功

#### Scenario: 真实测试显示真实投递信息
- **WHEN** 系统执行真实 Webhook 测试投递
- **THEN** 页面展示真实状态码、耗时、错误原因、最近投递时间和签名摘要

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

