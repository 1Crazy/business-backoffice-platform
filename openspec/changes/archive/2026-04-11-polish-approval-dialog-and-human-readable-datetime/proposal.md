## Why

最近这批前端实现里暴露了两个已经被用户直接感知的问题：OA 的“待我审批”在提交通过/驳回意见时仍然走浏览器原生输入框，交互与项目现有对话框体系不一致；同时多个前端页面会把后端返回的 ISO 时间字符串直接显示给用户，出现 `2026-04-09T01:00:00.000Z` 这类不适合业务界面的时间文本。既然代码已经完成修正，就需要把这两类行为沉淀到 OpenSpec，避免后续页面再次回退到原生 prompt 或原样暴露时间串。

## What Changes

- 明确 OA “待我审批”里的通过/驳回动作必须通过项目内结构化 dialog 收集审批意见，而不是依赖浏览器原生 `prompt`。
- 为多后台前端补充统一的时间展示约束，要求用户可见的日期时间信息使用一致、可读的人类格式展示，而不是直接显示原始 ISO 时间串。
- 将这次已经完成的实现补录为一个独立 OpenSpec change，并同步回主 specs 后归档。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `office-automation-workspace`: 收紧审批人处理待我审批事项时的交互要求，明确通过/驳回动作使用结构化 dialog 收集意见。
- `backoffice-visual-language`: 补充多后台前端对用户可见时间信息的统一格式化展示要求。

## Impact

- Affected code:
  - `apps/oa-web/src/composables/approvals/useApprovalsInboxPage.ts`
  - `apps/oa-web/src/pages/approvals/ApprovalsInboxPage.vue`
  - `apps/oa-web/src/pages/approvals/MyRequestsPage.vue`
  - `apps/oa-web/src/pages/leave/LeaveRequestPage.vue`
  - `apps/oa-web/src/pages/announcements/*`
  - `apps/oa-web/src/pages/workspace/WorkspacePage.vue`
  - `apps/oa-web/src/utils/display.ts`
  - `apps/scrm-web/src/utils/display.ts`
  - `apps/scrm-web/src/components/RecordUploadPanel.vue`
  - `apps/scrm-web/src/pages/leads/components/*`
  - `apps/scrm-web/src/pages/customers/components/CustomerFollowUpDrawer.vue`
  - `apps/scrm-web/src/pages/system-administration/components/AuditLogsSection.vue`
  - `apps/main-web/src/utils/display.ts`
- Affected APIs:
  - 无新增后端接口，继续复用现有返回时间字段与审批动作接口。
- Dependencies:
  - 继续使用现有 `Vue 3` 与 `Element Plus`，不新增第三方依赖。
- Systems:
  - `oa-web`
  - `scrm-web`
  - `main-web`
