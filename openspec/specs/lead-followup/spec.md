# lead-followup Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 销售人员可以管理转化前线索
系统 SHALL 允许具备授权的用户在线索转化为客户之前创建、更新、分配和跟踪线索。

#### Scenario: 创建带归属人的线索
- **WHEN** 具备授权的用户创建线索并指定归属人
- **THEN** 系统保存该线索、初始状态和对应归属人

#### Scenario: 调整线索归属
- **WHEN** 具备授权的用户修改线索归属人
- **THEN** 系统更新线索归属人并保留原有线索记录

### Requirement: 线索可以被转化为客户
系统 SHALL 允许具备授权的用户将线索转化为客户记录，并且 SHALL 将原始线索标记为已转化。

#### Scenario: 线索成功转化
- **WHEN** 具备授权的用户转化一个尚未被转化的线索
- **THEN** 系统创建关联客户记录并将线索状态改为已转化

#### Scenario: 阻止重复转化
- **WHEN** 具备授权的用户尝试再次转化一个已转化线索
- **THEN** 系统拒绝该请求并保持现有转化结果不变

### Requirement: 跟进行为带提醒记录
系统 SHALL 允许具备授权的用户为线索和客户记录跟进内容，并在需要时为下一次动作创建待办提醒。

#### Scenario: 记录包含下一次动作的跟进
- **WHEN** 具备授权的用户提交包含下一次跟进时间的跟进记录
- **THEN** 系统保存跟进内容并创建或更新待处理提醒

#### Scenario: 查看跟进历史
- **WHEN** 用户打开线索详情或客户详情页面
- **THEN** 系统按照时间倒序展示跟进历史

