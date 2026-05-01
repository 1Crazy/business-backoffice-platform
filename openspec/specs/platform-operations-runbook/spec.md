# platform-operations-runbook Specification

## Purpose
TBD - created by archiving change close-platform-security-operational-gaps. Update Purpose after archive.
## Requirements
### Requirement: 仓库提供完整近生产容器化联调拓扑
仓库 SHALL 提供包含 API、数据库、主应用 `main-web`、子应用 `oa-web`、子应用 `scrm-web` 和必要基础设施的近生产 Docker 编排。该拓扑 MUST 能验证 qiankun 主子应用加载、统一登录、cookie 刷新、API 代理和健康检查，而不是只启动单个业务子应用。

#### Scenario: 启动完整容器拓扑
- **WHEN** 开发者或 CI 启动近生产 Docker 编排
- **THEN** API、数据库、`main-web`、`oa-web` 和 `scrm-web` 都能启动
- **AND** 主应用能够加载两个子应用并通过同一 API 完成登录与刷新

#### Scenario: 子应用容器缺失
- **WHEN** Docker 编排缺少任一生产必需前端应用
- **THEN** 该编排不得被标记为完整近生产验证入口

### Requirement: 平台具备数据库备份与恢复运行手册
仓库 SHALL 提供数据库备份和恢复脚本或文档，覆盖 PostgreSQL 数据、上传文件或对象存储引用的一致性要求、恢复演练步骤和失败处理。备份流程 MUST 避免把生产密钥、令牌或个人隐私样例硬编码进仓库。

#### Scenario: 运维人员执行备份
- **WHEN** 运维人员按运行手册执行数据库备份
- **THEN** 备份产物包含恢复平台核心数据所需的信息
- **AND** 手册说明上传文件或对象存储数据如何与数据库快照保持一致

#### Scenario: 运维人员执行恢复演练
- **WHEN** 运维人员按运行手册在测试环境恢复备份
- **THEN** API 能连接恢复后的数据库并通过健康检查
- **AND** 手册记录恢复验证步骤和常见失败处理

### Requirement: 平台进程支持优雅关闭
系统 SHALL 在容器或进程收到关闭信号时执行优雅关闭，停止接收新请求，等待已进入处理链路的请求完成，并关闭数据库连接和其他关键资源。关闭流程 MUST 有超时保护，避免进程无限挂起。

#### Scenario: 容器收到终止信号
- **WHEN** API 容器收到 `SIGTERM`
- **THEN** 系统停止接收新请求并开始优雅关闭
- **AND** 数据库连接在进程退出前被关闭

#### Scenario: 关闭超过超时
- **WHEN** 优雅关闭超过配置的最大等待时间
- **THEN** 系统记录关闭超时日志并退出进程

