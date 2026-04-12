## Context

当前仓库已经形成统一主应用、平台治理、OA 协同和 SCRM 经营三层结构，但第一阶段真正阻碍企业落地的，不是缺少更多业务域，而是现有业务链路还不够完整。OA 目前以请假审批为主，无法承接企业日常高频行政申请；SCRM 在商机赢单后缺少合同、回款与续费等后续对象；主应用虽然已经能统一承载 OA 与 SCRM，但用户仍然需要在不同页面之间自行寻找待办、提醒和关键消息。

第一阶段的目标是让系统在单企业内部形成稳定使用习惯，因此设计上会优先采用“面向明确业务对象的增量扩展”，而不是提前引入通用流程引擎或多租户抽象。该阶段仍然复用当前统一身份、RBAC、数据范围、审计日志和主应用导航体系。

## Goals / Non-Goals

**Goals:**
- 为 OA 增加可落地的高频行政申请能力，并保持统一提交、审批、跟踪和审计体验。
- 为 SCRM 增加赢单后的报价、合同、回款与续费闭环，使经营数据不再停留在商机阶段。
- 在主应用内提供跨 OA 与 SCRM 的统一待办、提醒和通知入口。
- 在现有看板和数据范围规则之上补充更贴近经营与协同复盘的指标。

**Non-Goals:**
- 不在本阶段引入通用可配置流程引擎。
- 不在本阶段引入多租户、SaaS 套餐或租户配置中心。
- 不把 SCRM 一次性扩展成完整 ERP，不覆盖采购、库存、订单履约和财务总账。

## Decisions

### Decision: 第一阶段的行政申请采用“固定流程 + 多业务类型”扩展，而不是立即引入流程引擎

第一阶段最重要的是尽快补足企业高频使用场景，因此会在 OA 域内新增报销、出差、采购和用印等明确申请类型，并复用与请假一致的统一提交流程、审批摘要、审批意见和审计链路。

选择这种方案，而不是直接实现可配置流程引擎，是因为当前阶段的主要风险在于“功能不够支撑落地”，而不是“流程抽象不够通用”。固定流程可以更快交付、更容易验证，也能为第二阶段的流程引擎沉淀真实业务模板。

### Decision: 赢单后的经营闭环围绕商机主线扩展，而不是平行建设另一套独立系统

报价、合同、回款计划、回款记录和续费提醒会作为商机赢单后的下游对象进入领域模型，并与客户、商机和归属人建立显式关联。商机详情和客户上下文需要能够继续看到这些后续对象的摘要和状态。

选择“围绕赢单商机外延扩展”的方式，而不是独立做合同系统，是为了保持销售经营链路的连续性，让销售主管、负责人和管理层可以沿着同一条业务主线复盘从线索到回款的全过程。

### Decision: 统一待办中心由主应用承载聚合入口，领域明细仍由子应用负责

统一待办与通知入口会放在 `main-web` 统一工作台语境下，负责聚合审批待办、SCRM 跟进提醒、续费提醒和关键业务通知，并提供跳转入口。具体详情页和操作页仍然留在 OA 或 SCRM 子应用中完成，主应用不直接承载领域复杂表单。

选择这种聚合方式，是为了利用现有主应用的统一门户定位，同时避免主应用直接耦合过多领域逻辑。主应用只负责“我现在需要处理什么”，业务域页面继续负责“我如何具体处理”。

### Decision: 第一阶段 Workfeed 采用“源对象投影 + 已读覆盖层”的最小聚合模型

为了尽快支撑 `3.1 / 3.2`，第一阶段的 Workfeed 不引入独立的流程引擎、消息总线或统一业务表，而是直接复用 OA 与 SCRM 已经落地的领域对象，把“需要处理”和“需要知道”的信息投影为两类轻量聚合结果：

- `todo`：面向“当前用户还要处理什么”，只收敛未完成、需要行动的事项。
- `notification`：面向“当前用户最近发生了什么”，只收敛结果告知、提醒消息和公告摘要。
- `read-state overlay`：只为通知维护用户维度的已读状态，不复制通知正文，也不改变原始业务对象状态。

这种模型的目的是把统一工作入口做成一个稳定的读模型，而不是在主应用里再造一套工作流系统。主应用负责统一列表、筛选和跳转，领域系统继续负责状态变更、权限校验和详情操作。

#### Minimal Source Coverage

第一阶段最小接入范围直接绑定现有业务表和状态口径：

| Workfeed 视图 | 来源对象 | 进入条件 | 面向用户 | 统一类型 | 跳转上下文 |
| --- | --- | --- | --- | --- | --- |
| `todo` | `LeaveRequest` | `status = PENDING` 且 `approverId = 当前用户` | 审批人 | `LEAVE_APPROVAL` | `/oa/approvals/pending` |
| `todo` | `AdministrativeRequest` | `status = PENDING` 且 `approverId = 当前用户` | 审批人 | `ADMINISTRATIVE_APPROVAL` | `/oa/administrative-requests/pending?requestId={id}` |
| `todo` | `Reminder` | `status = PENDING` 且 `ownerId = 当前用户` | 跟进负责人 | `LEAD_REMINDER` / `CUSTOMER_REMINDER` | 线索列表或客户跟进抽屉 |
| `todo` | `RenewalReminder` | `status = PENDING` 且 `ownerId = 当前用户` | 经营负责人 | `RENEWAL_REMINDER` | `/scrm/revenue-operations?customerId={customerId}&opportunityId={opportunityId}` |
| `notification` | `LeaveRequest` | `status in (APPROVED, REJECTED, CANCELLED)` 且 `applicantId = 当前用户` | 申请人 | `LEAVE_RESULT` | `/oa/approvals/mine` |
| `notification` | `AdministrativeRequest` | `status in (APPROVED, REJECTED, CANCELLED)` 且 `applicantId = 当前用户` | 申请人 | `ADMINISTRATIVE_RESULT` | `/oa/administrative-requests/mine?requestId={id}` |
| `notification` | `Reminder` | `status = PENDING` 且 `ownerId = 当前用户` | 跟进负责人 | `LEAD_REMINDER` / `CUSTOMER_REMINDER` | 线索列表或客户跟进抽屉 |
| `notification` | `RenewalReminder` | `status = PENDING` 且 `ownerId = 当前用户` | 经营负责人 | `RENEWAL_REMINDER` | `/scrm/revenue-operations?customerId={customerId}&opportunityId={opportunityId}` |
| `notification` | `Announcement` | `status = ACTIVE` | 全体可见用户 | `ANNOUNCEMENT` | `/oa/announcements/{id}` |

这里刻意不把“所有业务事件”都塞进统一通知。第一阶段只接已经具备稳定 owner、状态和跳转上下文的对象，保证 Workfeed 能先形成一个可靠最小闭环。

#### Unified Projection Shape

待办与通知分别暴露独立列表，但共享同一套最小语义骨架：

| 字段 | `todo` | `notification` | 说明 |
| --- | --- | --- | --- |
| `id` | required | required | 聚合项 ID，采用 `{type}:{sourceId}` 形式，便于前端去重和列表渲染 |
| `domain` | required | required | 业务域，第一阶段固定为 `oa` 或 `scrm` |
| `type` | required | required | 统一类型枚举，前端据此渲染图标、文案和筛选项 |
| `title` | required | required | 直接可读的动作标题 |
| `summary` | optional | optional | 简短摘要，优先复用原始业务对象已有描述 |
| `priority` | required | required | `HIGH / MEDIUM / LOW`，用于排序和视觉强调 |
| `targetPath` | required | required | 主应用内可直接跳转的目标路径 |
| `targetLabel` | required | required | 跳转动作文案 |
| `sourceId` | required | required | 原始领域对象 ID，便于已读标记和深链恢复 |
| `dueAt` | required | not used | 待办处理截止或参考时间，仅 `todo` 需要 |
| `status` | required | not used | 原始对象状态，仅 `todo` 需要，用于提醒“待处理/已逾期”等衍生显示 |
| `createdAt` | required | not used | 待办生成时间，用于次级排序 |
| `occurredAt` | not used | required | 通知发生时间，用于倒序浏览 |
| `isRead` / `readAt` | not used | required | 通知已读状态，仅通过覆盖层计算 |

#### Priority And Sorting Rules

第一阶段不引入可配置优先级规则，直接采用足够稳定的固定口径：

- OA 审批类待办默认视为高优先级，因为它们天然代表需要当前用户决策的阻塞动作。
- SCRM 跟进提醒与续费提醒按 `remindAt` 计算优先级：24 小时内为 `HIGH`，3 天内为 `MEDIUM`，其余为 `LOW`。
- 待办列表优先按 `dueAt` 升序排列，让最近到期的事项最先出现。
- 通知列表按 `occurredAt` 倒序排列，让最近发生的结果和消息优先可见。

#### Read State Strategy

通知已读状态使用单独的 `WorkfeedNotificationRead` 覆盖表维护，唯一键为 `userId + notificationType + sourceId`。这样可以满足三个目标：

- 不需要为 OA 审批结果、SCRM 提醒和公告再复制一份统一通知正文。
- 不会污染原始领域对象的状态语义，例如提醒仍然是 `PENDING`，但某个用户已经读过该提醒。
- 可以允许同一个源对象同时继续作为 `todo` 和 `notification` 出现，只在通知视图维度维护已读态。

#### Main-Web Consumption Boundary

`main-web` 在 `3.3` 只需要消费统一的 Workfeed DTO，并基于 `domain / type / priority / targetPath` 渲染入口、筛选器和跳转动作，不需要理解 OA 审批字段、客户跟进表单或经营闭环对象细节。这样能够把主应用和子应用之间的耦合收敛在“可筛选列表 + 深链跳转”这一个稳定边界上。

### Decision: 看板指标继续复用现有数据范围与业务口径，不额外引入分析仓库

销售漏斗、人员业绩、回款预测和审批时效等指标会建立在现有业务对象、阶段状态、审批状态和数据范围规则之上，由共享后端直接聚合计算。

选择这种方式，而不是先建设单独分析层，是因为第一阶段的目标是补齐管理层可用的复盘视角，而不是建设独立 BI 平台。只要指标口径与业务列表保持一致，就更容易被业务方理解和信任。

## Risks / Trade-offs

- [第一阶段范围过大，导致每条线都只做了一半] → 先明确只覆盖 4 类行政申请和赢单后的首批经营对象，不在本阶段继续外扩 ERP 能力。
- [统一待办入口与子应用详情页之间跳转链路复杂] → 主应用只维护规范化的待办摘要和目标链接，复杂处理流程仍留在领域页面完成。
- [回款与续费数据口径和销售看板口径不一致] → 统一由共享后端定义时间口径、状态口径和 owner/data-scope 规则，避免前后端各自解释。
- [行政申请类型增多后复用度不高] → 在固定流程前提下统一抽象申请基类、状态、审批意见、附件和审计记录，为第二阶段流程引擎保留演进空间。

## Migration Plan

- 以增量方式新增 OA 申请对象、报价/合同/回款对象、统一待办聚合对象及其相关表结构。
- 保持现有请假申请、商机和看板接口继续可用，通过新增字段、关联对象和新接口扩展能力。
- 为默认角色和导航增加首批新权限点与菜单入口，种子数据中补齐权限目录和演示数据。
- 先在主应用中引入统一待办入口，再逐步接入 OA 审批、SCRM 跟进和续费提醒。

## Open Questions

- 回款记录是否需要区分销售确认与财务确认两个状态层级。
- 报销、采购和用印在第一阶段是否都采用单审批人模型，还是允许少量固定会签。
- 统一通知在第一阶段是否仅覆盖站内通知，还是同步落地邮件或企业 IM 渠道。
