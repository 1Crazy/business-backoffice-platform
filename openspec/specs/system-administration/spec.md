# system-administration Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 敏感后台操作可审计
系统 SHALL 为敏感后台操作记录审计日志，包括认证事件以及创建、更新、删除、启用、停用、分配和转化等动作。

#### Scenario: 记录客户转交的审计日志
- **WHEN** 具备授权的用户调整客户归属人
- **THEN** 系统保存包含操作者、动作类型、对象类型、对象标识和时间戳的审计日志

#### Scenario: 记录登录审计日志
- **WHEN** 员工成功登录
- **THEN** 系统为该认证事件保存一条审计日志

### Requirement: 管理员可以管理字典项
系统 SHALL 允许具备授权的管理员创建、更新、启用、停用和查看业务表单使用的字典项，包括客户来源和客户状态等选项。

#### Scenario: 新增字典项
- **WHEN** 具备授权的管理员在受支持的字典类型下创建字典项
- **THEN** 系统保存该字典项并使其可用于业务表单

#### Scenario: 停用字典项
- **WHEN** 具备授权的管理员停用一个字典项
- **THEN** 系统阻止该字典项出现在新的表单选择中，同时保留历史记录

### Requirement: 系统支持业务附件上传
系统 SHALL 允许具备授权的用户上传附件并将其关联到受支持的业务记录。

#### Scenario: 为客户上传附件
- **WHEN** 具备授权的用户为客户记录上传受支持文件
- **THEN** 系统保存附件元数据并将其关联到该客户

#### Scenario: 无权限上传被拒绝
- **WHEN** 不具备上传权限的用户尝试上传附件
- **THEN** 系统拒绝该请求并返回未授权结果

