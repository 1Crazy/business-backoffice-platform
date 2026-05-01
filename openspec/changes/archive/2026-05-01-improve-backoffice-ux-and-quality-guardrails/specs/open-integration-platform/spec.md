## MODIFIED Requirements

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
