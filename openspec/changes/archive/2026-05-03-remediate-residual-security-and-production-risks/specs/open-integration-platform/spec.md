## MODIFIED Requirements

### Requirement: 平台提供租户级 Open API 与凭证治理
系统 SHALL 提供租户级 Open API 能力，并允许租户管理员或平台运营者管理 API 凭证、权限范围和密钥轮换。每个 API 凭证 MUST 明确绑定所属租户和可访问范围。Open API 凭证校验 MUST 使用不泄露密钥的比较方式，并对连续失败校验执行限流、审计和必要的临时拒绝。生产或多实例部署中的限流状态 MUST 使用跨实例共享存储，不能只依赖单进程内存计数。Open API secret、身份连接器 client secret 等不可回读凭证 MUST 使用慢哈希或带应用级 pepper 的强保护方案存储，系统 MUST NOT 继续以单次 SHA-256 作为新凭证的唯一存储保护。

#### Scenario: 租户管理员创建 API 凭证
- **WHEN** 租户管理员创建一个新的 Open API 凭证
- **THEN** 系统为该凭证绑定租户归属和访问范围，并支持后续轮换或撤销
- **AND** 系统只返回一次明文 secret
- **AND** 系统以强保护格式存储 secret 校验材料

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

#### Scenario: 旧 SHA-256 凭证进入迁移窗口
- **WHEN** 系统读取到旧版本 SHA-256 凭证记录
- **THEN** 系统按迁移策略要求管理员轮换或在成功验证后升级存储格式
- **AND** 系统记录迁移状态但不输出明文 secret

### Requirement: 平台提供租户级 Webhook 事件回调
系统 SHALL 允许租户配置 Webhook 订阅，以接收审批、经营、回款、流程和系统治理等关键事件的回调。Webhook 订阅 MUST 具备签名校验、失败重试和投递记录。Webhook 端点配置和测试 MUST 明确区分真实投递与模拟结果，并在真实投递时限制协议、内网地址、超时、重定向和响应体长度。平台 MUST 支持按租户或环境配置 Webhook 目标域名 allowlist；启用 allowlist 后，不在允许范围内的目标域名 MUST 被拒绝。Webhook signing secret MUST 以应用级加密或等价密钥管理方式存储，真实投递 MUST 由异步队列/worker 执行，不得阻塞创建、更新或业务事件请求线程。

#### Scenario: 租户订阅关键业务事件
- **WHEN** 租户管理员为某类事件配置 Webhook 回调地址
- **THEN** 系统在该类事件发生时创建待投递任务
- **AND** worker 使用受保护 signing secret 生成签名并投递回调

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

#### Scenario: Webhook 目标响应缓慢
- **WHEN** Webhook 目标端点响应缓慢或超时
- **THEN** API 请求线程不等待外部端点完成
- **AND** delivery 记录展示排队、重试或失败状态
