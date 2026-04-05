# customer-management Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 销售人员可以维护客户档案
系统 SHALL 允许具备授权的用户创建和更新客户档案，支持维护客户名称、联系方式、来源、状态、归属人和备注信息。

#### Scenario: 创建客户档案
- **WHEN** 具备授权的用户提交合法的客户表单
- **THEN** 系统根据提交的来源、状态和归属人信息创建客户记录

#### Scenario: 更新客户档案
- **WHEN** 具备授权的用户编辑已有客户档案
- **THEN** 系统保存更新后的客户属性并保持客户身份不变

### Requirement: 客户记录支持标签和列表筛选
系统 SHALL 允许用户为客户分配多个标签，并按关键字、来源、状态、归属人和标签筛选客户列表。

#### Scenario: 按归属人和状态筛选客户
- **WHEN** 用户使用指定归属人和状态筛选客户列表
- **THEN** 系统仅返回同时满足这两个条件的客户记录

#### Scenario: 客户标签显示在详情和列表中
- **WHEN** 用户为客户分配一个或多个标签
- **THEN** 系统在客户详情和列表上下文中展示这些标签

### Requirement: 客户归属变更可追溯
系统 SHALL 允许具备授权的用户调整客户归属，并且 SHALL 在审计轨迹中保留可追溯的归属变更记录。

#### Scenario: 调整客户归属人
- **WHEN** 具备授权的用户修改客户归属人
- **THEN** 系统更新当前归属人并记录这次变更用于审计

