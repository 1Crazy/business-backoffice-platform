# access-control Specification

## Purpose
TBD - created by archiving change bootstrap-scrm-mvp. Update Purpose after archive.
## Requirements
### Requirement: 管理员可以登录管理后台
系统 SHALL 允许处于启用状态的员工账号通过账号标识和密码登录管理后台，并且 SHALL 拒绝无效账号或已停用账号的登录请求。

#### Scenario: 登录成功
- **WHEN** 启用状态的员工提交正确的账号标识和密码
- **THEN** 系统返回认证令牌以及该员工的基础资料

#### Scenario: 停用账号被拒绝登录
- **WHEN** 已停用员工提交正确的登录凭证
- **THEN** 系统拒绝访问并提示该账号当前不可用

### Requirement: 系统执行基于角色的权限控制
系统 SHALL 对菜单可见性和受保护接口执行基于角色的权限控制。

#### Scenario: 菜单可见性遵循角色授权
- **WHEN** 员工以一个或多个已分配角色登录
- **THEN** 系统仅展示这些角色被授予的菜单

#### Scenario: 受保护接口需要对应权限
- **WHEN** 员工在缺少所需权限的情况下访问受保护接口
- **THEN** 系统拒绝该请求并返回未授权结果

### Requirement: 管理员可以管理部门和员工
系统 SHALL 允许具备授权的管理员创建、更新、启用、停用和查看部门及员工账号。

#### Scenario: 在部门下创建员工
- **WHEN** 具备授权的管理员创建员工并将其分配到一个已存在部门
- **THEN** 系统保存该员工与部门的关联关系，并默认其处于启用状态

#### Scenario: 停用员工账号
- **WHEN** 具备授权的管理员停用一个员工账号
- **THEN** 系统阻止该员工后续登录，同时保留历史归属记录

