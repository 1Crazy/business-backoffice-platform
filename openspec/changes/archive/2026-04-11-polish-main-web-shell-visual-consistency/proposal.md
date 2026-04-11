## Why

主系统最近补齐了统一入口与平台治理原生页面后，视觉上仍然和 `oa-web`、`scrm-web` 存在明显断层：主系统原生页签没有继承子系统的共享 tab 结构，表格、按钮、输入框等基础反馈也不在同一节奏里；与此同时，主系统侧边栏与顶部标题区的配色仍然没有收敛到足够稳定的“统一门户”气质。更关键的是，主系统与子系统现在都在直接覆盖 `Element Plus` 的全局 `.el-*` 类名，导致在主系统里来回切换子系统时存在样式串扰风险。需要把视觉主题和样式边界一起收敛成显式规范，避免后续继续互相覆盖。

## What Changes

- 约束主系统原生页面复用与子系统一致的基础组件视觉结构，包括 tab、表格、按钮、输入框、分页、空态和卡片层次。
- 约束主系统壳层在共享视觉语言之上采用更克制、更稳定的宿主主题覆盖，统一桌面侧边栏、顶部标题区和移动端菜单抽屉的配色与层次。
- 约束主系统与子系统的全局组件样式不得跨宿主/子应用边界互相污染，避免在 `qiankun` 承载链路里发生样式覆盖。
- 补充主系统平台治理页与代表性子系统页面的浏览器验证，确保主系统壳层与子系统内容并置时不再出现明显的视觉分叉和样式串扰。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backoffice-visual-language`: 补充主系统原生页面与宿主壳层必须与子系统共享结构化组件语言，并允许主系统通过更稳定的主题覆盖表达统一门户身份。
- `backoffice-super-app-shell`: 补充主系统桌面/移动壳层与原生平台页在统一门户场景下的视觉一致性要求，并约束宿主与子应用样式边界，避免原生页与嵌入态子应用出现割裂或串扰。

## Impact

- `apps/main-web/src/styles/global.css`
- `apps/main-web/src/layout/AppLayout.vue`
- `apps/main-web/src/layout/components/LayoutSidebarNav.vue`
- `apps/main-web/src/layout/components/LayoutSidebarNav.css`
- `apps/main-web/src/layout/components/LayoutMobileNav.vue`
- `apps/main-web/src/pages/platform-governance/PlatformGovernancePage.vue`
- `apps/main-web/src/micro/runtime.ts`
- `apps/main-web/src/main.ts`
- `apps/oa-web/src/styles/global.css`
- `apps/scrm-web/src/styles/global.css`
- 相关前端测试与浏览器验证脚本
- `openspec/specs/backoffice-visual-language/spec.md`
- `openspec/specs/backoffice-super-app-shell/spec.md`
