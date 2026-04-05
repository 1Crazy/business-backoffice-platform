# operations-dashboard Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 看板展示核心销售运营指标
系统 SHALL 提供看板视图，在选定时间范围内汇总新增客户数、跟进次数和线索转化率。

#### Scenario: 查看默认时间范围的看板
- **WHEN** 用户在未调整筛选条件时打开看板
- **THEN** 系统展示默认时间范围及其对应的核心指标

#### Scenario: 查看自定义时间范围的看板
- **WHEN** 用户选择自定义开始日期和结束日期
- **THEN** 系统基于该精确时间范围重新计算并展示指标

### Requirement: 看板指标遵守数据权限范围
系统 SHALL 按照当前登录用户的数据访问权限范围收口看板指标。

#### Scenario: 销售成员仅查看本人数据
- **WHEN** 销售成员打开看板
- **THEN** 除非被授予更广范围权限，否则系统仅统计该销售成员本人归属的数据

#### Scenario: 主管查看团队范围数据
- **WHEN** 具备团队级可见范围的主管打开看板
- **THEN** 系统统计该主管被授权团队范围内归属的数据

