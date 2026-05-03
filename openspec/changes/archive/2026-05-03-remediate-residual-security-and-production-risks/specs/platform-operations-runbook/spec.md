## MODIFIED Requirements

### Requirement: 平台具备数据库备份与恢复运行手册
仓库 SHALL 提供数据库备份和恢复脚本或文档，覆盖 PostgreSQL 数据、上传文件或对象存储引用的一致性要求、恢复演练步骤和失败处理。备份流程 MUST 避免把生产密钥、令牌或个人隐私样例硬编码进仓库。生产运行手册 MUST 提供自动化定时备份、备份结果校验、恢复演练记录和附件一致性校验步骤，而不是只依赖人工临时执行 `pg_dump`。

#### Scenario: 运维人员执行备份
- **WHEN** 运维人员按运行手册执行数据库备份
- **THEN** 备份产物包含恢复平台核心数据所需的信息
- **AND** 手册说明上传文件或对象存储数据如何与数据库快照保持一致

#### Scenario: 自动备份任务执行
- **WHEN** 生产环境到达配置的备份时间窗口
- **THEN** 系统或运维脚本自动生成数据库备份并写入独立备份位置
- **AND** 记录备份结果、大小、耗时和校验摘要

#### Scenario: 运维人员执行恢复演练
- **WHEN** 运维人员按运行手册在测试环境恢复备份
- **THEN** API 能连接恢复后的数据库并通过健康检查
- **AND** 手册记录恢复验证步骤和常见失败处理

#### Scenario: 附件与数据库不一致
- **WHEN** 一致性校验发现数据库附件记录缺少对应文件或对象
- **THEN** 系统输出可追踪的不一致报告
- **AND** 运维手册说明标记、补偿或回滚处理步骤

## ADDED Requirements

### Requirement: Swagger 文档暴露受访问控制保护
系统 SHALL 默认关闭非本地环境 Swagger 文档。确需在非本地环境启用时，Swagger 文档 MUST 受到 Basic Auth、IP allowlist、反向代理鉴权或等价访问控制保护，且 MUST NOT 公开暴露内部接口契约。

#### Scenario: 本地环境启用 Swagger
- **WHEN** 开发者在本地环境显式启用 Swagger
- **THEN** 系统允许访问 `/docs`
- **AND** 不要求生产访问控制配置

#### Scenario: 生产环境启用 Swagger 但未配置保护
- **WHEN** 非本地环境设置 `SWAGGER_ENABLED=true` 但未配置访问控制
- **THEN** 系统拒绝启动或不注册 `/docs`

#### Scenario: 生产环境受控访问 Swagger
- **WHEN** 非本地环境启用 Swagger 且配置了访问控制
- **THEN** 未通过访问控制的请求无法访问文档
- **AND** 通过访问控制的请求可以查看文档
