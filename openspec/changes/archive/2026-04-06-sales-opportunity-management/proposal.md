## Why

当前仓库已经完成“线索 -> 客户 -> 跟进 -> 基础看板”的 SCRM 前半段闭环，但一旦销售进入实质推进阶段，系统就缺少统一的商机载体来管理销售阶段、预计金额、预计成交时间、输赢结果与阶段推进轨迹。没有商机层，团队只能把成交过程继续散落在线索备注、客户跟进或线下表格里，导致销售预测、主管复盘和经营分析都缺少稳定口径。

## What Changes

- 新增面向 SCRM 的商机管理能力，允许销售围绕客户创建、更新、查看、分配和推进商机。
- 为商机建立标准化销售阶段模型，覆盖进行中、已赢单、已输单等关键状态，并支持记录阶段变更时间、预计成交日期、预计金额和下一步动作。
- 提供商机列表、详情和关键筛选能力，支持按阶段、归属人、客户、时间窗口和结果状态查看销售管道。
- 让商机复用现有的统一身份、角色权限、数据范围和审计日志体系，而不是额外搭建一套平行机制。
- 扩展现有运营看板，使其除了客户和线索指标外，还能展示商机管道、赢单结果和销售预测所需的核心指标。

## Capabilities

### New Capabilities
- `sales-opportunity-management`: 提供商机创建、阶段推进、赢单/输单收口、列表筛选、详情跟踪和数据权限控制能力。

### Modified Capabilities
- `operations-dashboard`: 扩展看板指标定义，增加商机管道、赢单结果和销售预测相关统计口径。

## Impact

- Affected code:
  - `apps/api/src/modules` 下新增 `sales-opportunities` 领域模块及相关 DTO、VO、repository、mapper
  - `apps/api/prisma` 新增商机相关模型、迁移和种子数据
  - `apps/scrm-web/src/pages`, `apps/scrm-web/src/api`, `apps/scrm-web/src/composables` 新增商机页面与交互
  - `apps/scrm-web/src/router` 与导航配置补充商机入口
  - `apps/api/src/modules/dashboard` 与 `apps/scrm-web/src/pages/dashboard` 调整看板指标
- Affected APIs:
  - 商机创建、更新、详情、列表、阶段推进、赢单/输单收口接口
  - 运营看板概览接口
- Dependencies:
  - existing NestJS, Prisma, Vue 3, Pinia, Vue Router and Element Plus stack
  - existing access-control, audit-log and data-scope infrastructure
- Systems:
  - SCRM 销售经营后台
  - NestJS 单体 API 服务
  - PostgreSQL 业务数据模型与统计口径
