## Why

第一阶段补齐高频落地能力后，系统仍然会受到“流程和权限规则较固定”的限制。只要企业组织结构、审批习惯、数据可见性或通知方式稍微复杂，就需要频繁改代码，难以高效复制到更多企业。需要把固定业务能力升级成可配置、可治理、可扩展的产品能力。

## What Changes

- 引入可配置流程引擎，把固定审批流升级为可定义表单、节点、分支、抄送、加签和转交的流程体系。
- 细化权限与治理模型，补齐按团队、区域、客户池、字段和动作维度的授权与数据访问控制。
- 增加统一消息与通知中心，支持站内消息、邮件、企业 IM 渠道和业务订阅规则配置。
- 提升企业交付基础设施，补齐对象存储、文件预览、批量导入导出、定时任务和配置化系统治理能力。

## Capabilities

### New Capabilities
- `configurable-workflow-engine`: 覆盖流程模板、节点编排、条件分支、抄送加签转交、流程实例和表单配置能力。
- `granular-access-governance`: 覆盖细粒度权限、字段级可见性、团队/区域/客户池等扩展数据范围模型。
- `enterprise-notification-center`: 覆盖统一消息中心、通知渠道接入、业务订阅和催办升级能力。
- `enterprise-delivery-foundation`: 覆盖对象存储、文件预览、导入导出、定时任务和配置型基础设施能力。

### Modified Capabilities
- `office-automation-workspace`: 把固定行政申请流升级为基于流程模板驱动的工作台与审批中心。
- `access-control`: 扩展角色授权与数据范围规则，使权限治理能够表达更细的组织和字段级限制。
- `system-administration`: 扩展系统管理能力，使其可以治理通知、存储、导入导出和配置化基础设施。

## Impact

- `apps/oa-web`
- `apps/main-web`
- `apps/api/src/modules/office-automation`
- `apps/api/src/modules/roles`
- `apps/api/src/modules/users`
- `apps/api/src/modules/dictionaries`
- `apps/api/src/modules/uploads`
- 新增流程、消息中心、任务调度、导入导出和配置管理相关模块
- `apps/api/prisma/schema.prisma` 与相关迁移、种子数据
- 权限目录、角色授权界面和审批工作台交互
- 外部通知渠道和对象存储等基础设施依赖
- `openspec/specs/office-automation-workspace/spec.md`
- `openspec/specs/access-control/spec.md`
- `openspec/specs/system-administration/spec.md`
