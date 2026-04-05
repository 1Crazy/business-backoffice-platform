# operations-dashboard Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 看板展示核心销售运营指标
系统 SHALL 提供看板视图，在选定时间范围内汇总新增客户数、跟进次数、已转化线索数、线索总数、待处理提醒数和线索转化率。上述指标 SHALL 使用与业务列表一致的筛选口径和归属范围计算。

#### Scenario: 查看默认时间范围的看板
- **WHEN** 用户在未调整筛选条件时打开看板
- **THEN** 系统展示默认时间范围及其对应的核心指标

#### Scenario: 查看自定义时间范围的看板
- **WHEN** 用户选择自定义开始日期和结束日期
- **THEN** 系统基于该精确时间范围重新计算并展示指标

#### Scenario: 指标口径与业务数据一致
- **WHEN** 用户以同一时间范围和数据范围查看看板与业务列表
- **THEN** 系统使用一致的归属范围和统计口径计算这些指标

### Requirement: 看板指标遵守数据权限范围
系统 SHALL 按照当前登录用户的数据访问权限范围收口看板指标，并支持本人、本部门、子部门和全局等角色范围模型。

#### Scenario: 销售成员仅查看本人数据
- **WHEN** 销售成员打开看板
- **THEN** 除非被授予更广范围权限，否则系统仅统计该销售成员本人归属的数据

#### Scenario: 主管查看子部门范围数据
- **WHEN** 具备子部门范围可见性的主管打开看板
- **THEN** 系统统计该主管所在部门及其下级部门范围内归属的数据

#### Scenario: 全局范围角色查看全量数据
- **WHEN** 具备全局数据范围的管理员打开看板
- **THEN** 系统统计当前租户内全部归属数据

