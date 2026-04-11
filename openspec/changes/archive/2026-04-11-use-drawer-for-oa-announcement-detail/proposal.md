## Why

当前 OA 公告通知采用“列表页点击后跳转详情页”的方式，会打断员工浏览公告列表或工作台公告摘要时的上下文，尤其在只想快速扫读一条公告时需要来回进入和返回。对于这类轻量信息通知，优先使用抽屉承载详情更符合后台高频浏览场景，也能和仓库中已经存在的详情抽屉交互保持一致。

## What Changes

- 将 OA 公告详情的默认交互从整页跳转调整为在当前页面上下文中使用详情抽屉打开。
- 让公告列表页与工作台中的“最近公告”复用同一套公告详情抽屉与数据加载逻辑，而不是各自跳转到独立详情页。
- 补充 `office-automation-workspace` 的规格约束，明确公告类信息在列表或摘要上下文中打开详情时应优先保留当前浏览位置与页面上下文。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `office-automation-workspace`: 调整员工查看公告详情时的交互要求，优先在当前列表或工作台上下文中通过详情抽屉查看完整公告内容。

## Impact

- Affected code:
  - `apps/oa-web/src/pages/announcements/*`
  - `apps/oa-web/src/composables/announcements/*`
  - `apps/oa-web/src/pages/workspace/WorkspacePage.vue`
  - `apps/oa-web/src/router/index.ts`
  - `apps/main-web/src/config/navigation.ts`
- Affected APIs:
  - 无新增后端接口，继续复用现有公告列表与详情查询接口。
- Dependencies:
  - 继续使用现有 `Vue 3` 与 `Element Plus`，不新增第三方依赖。
- Systems:
  - `oa-web`
  - `main-web`
