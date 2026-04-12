## Why

当前系统已经具备统一主应用、平台治理、SCRM 主链路和 OA 首批协同能力，但距离“能在一家企业里真正长期跑起来”还有明显缺口：OA 仍然只有请假这一类固定流程，SCRM 在赢单后缺少合同、回款与续费等经营闭环，跨 OA 和 SCRM 的待办与通知也还没有形成统一工作入口。需要先补齐这些高频落地能力，把产品从“可演示”提升到“可持续使用”。

## What Changes

- 扩展 OA 高频行政与审批场景，新增报销、出差、采购和用印等常见内部申请类型，并让员工可以统一提交、审批、跟踪和审计。
- 扩展 SCRM 赢单后的经营链路，补齐报价、合同登记、回款计划、回款记录和续费提醒，让销售管理不再停在商机收口。
- 增加统一待办与通知入口，把 OA 审批、SCRM 跟进提醒、续费提醒和关键业务消息汇总到同一工作入口中。
- 增强管理视角的经营分析能力，补齐销售漏斗、人员业绩、回款预测和审批时效等经营与协同指标。

## Capabilities

### New Capabilities
- `administrative-requests`: 覆盖报销、出差、采购、用印等高频内部申请的提交、审批、跟踪与审计能力。
- `revenue-operations`: 覆盖报价、合同、回款计划、回款记录和续费提醒等赢单后经营闭环能力。
- `unified-workfeed-center`: 覆盖跨 OA 与 SCRM 的统一待办、通知订阅、催办和工作入口能力。

### Modified Capabilities
- `office-automation-workspace`: 扩展 OA 工作台与审批中心，使其能够承载多种高频行政申请、审批摘要和统一待办入口。
- `sales-opportunity-management`: 扩展赢单后的后续动作要求，使商机能够与报价、合同、回款和续费链路关联。
- `operations-dashboard`: 扩展经营分析能力，补充销售漏斗、人员业绩、回款预测和审批时效等关键指标。

## Impact

- `apps/oa-web`
- `apps/scrm-web`
- `apps/main-web`
- `apps/api/src/modules/office-automation`
- `apps/api/src/modules/sales-opportunities`
- 新增合同、回款、报价、通知等后端模块与前端页面
- `apps/api/prisma/schema.prisma` 与相关迁移、种子数据
- 主应用导航、工作台摘要、统一待办与通知入口
- 审计日志、提醒与消息相关接口
- `openspec/specs/office-automation-workspace/spec.md`
- `openspec/specs/sales-opportunity-management/spec.md`
- `openspec/specs/operations-dashboard/spec.md`
