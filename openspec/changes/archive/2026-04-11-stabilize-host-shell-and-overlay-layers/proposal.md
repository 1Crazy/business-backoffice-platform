## Why

当前主应用壳层已经能够承接 OA 与 SCRM，但最近这批联调代码暴露出两个需要尽快收口的问题：一是主应用导航和标题区的信息密度、当前域识别与移动端菜单语义还不够稳定；二是 SCRM 在被主应用承载时，多个业务弹窗和抽屉会受到宿主容器层级与滚动容器影响，出现“点击新增但弹层不可见或被裁切”的问题。既然这两类调整已经在代码里落地，就需要用一个统一的 OpenSpec change 把“宿主壳层体验”和“宿主模式下业务弹层稳定性”一起沉淀进主规范，避免后续改回去或在新页面上重复踩坑。

## What Changes

- 调整 `main-web` 主应用壳层，使当前业务域、导航分组、顶部标题区、用户上下文区和移动端菜单在桌面与窄屏下都保持更稳定、可扫读的门户语义。
- 明确主应用宿主内容区与子应用覆盖层的协作约束，要求被主应用承载的子应用弹窗、抽屉等覆盖层不得被宿主滚动容器裁剪。
- 为 SCRM 权限治理、系统管理、客户、线索和商机相关页面补齐宿主模式下的弹层展示约束，确保新增、编辑、分配、跟进、详情与收口等操作能在主应用中正常打开。
- 将这批已完成实现以一个 OpenSpec change 归档，并同步回现有主 specs。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `backoffice-super-app-shell`: 补充主应用壳层对当前业务域识别、导航分组稳定性和子应用覆盖层不被裁剪的宿主约束。
- `backoffice-visual-language`: 补充主应用壳层的紧凑门户视觉变体与移动菜单语义。
- `access-control`: 补充权限治理页面在宿主模式下打开部门、员工和角色弹窗的可见性要求。
- `customer-management`: 补充客户新增、标签、转交与跟进抽屉在宿主模式下的弹层稳定性要求。
- `lead-followup`: 补充线索新增、分配与跟进抽屉在宿主模式下的弹层稳定性要求。
- `sales-opportunity-management`: 补充商机新增、分配、详情、阶段推进与赢单/输单收口弹层在宿主模式下的稳定性要求。
- `system-administration`: 补充字典项新增/编辑弹窗在宿主模式下的可见性要求。

## Impact

- Affected code:
  - `apps/main-web/src/composables/useHostNavigation.ts`
  - `apps/main-web/src/layout/AppLayout.vue`
  - `apps/main-web/src/layout/components/LayoutMobileNav.vue`
  - `apps/main-web/src/layout/components/LayoutSidebarNav.vue`
  - `apps/main-web/src/layout/components/LayoutSidebarNav.css`
  - `apps/scrm-web/src/pages/access-control/components/*Dialog.vue`
  - `apps/scrm-web/src/pages/customers/components/*Dialog.vue`
  - `apps/scrm-web/src/pages/customers/components/CustomerFollowUpDrawer.vue`
  - `apps/scrm-web/src/pages/leads/components/*Dialog.vue`
  - `apps/scrm-web/src/pages/leads/components/LeadFollowUpDrawer.vue`
  - `apps/scrm-web/src/pages/opportunities/components/*Dialog.vue`
  - `apps/scrm-web/src/pages/opportunities/components/OpportunityDetailDrawer.vue`
  - `apps/scrm-web/src/pages/system-administration/components/DictionaryDialog.vue`
- Affected APIs:
  - 无新增后端接口，继续复用现有鉴权与业务接口。
- Dependencies:
  - 继续使用现有 `Vue 3`、`Element Plus`、`qiankun` 与宿主/子应用结构，不新增第三方依赖。
- Systems:
  - `main-web` 主应用壳层
  - `scrm-web` 被承载页面中的对话框与抽屉交互
