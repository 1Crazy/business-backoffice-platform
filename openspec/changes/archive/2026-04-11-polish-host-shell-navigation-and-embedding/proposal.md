## Why

主应用最近补齐了多后台统一壳层后，仍然暴露出两类影响使用判断的问题：导航分组文案残留域前缀徽标，削弱了“业务语义优先”的扫读节奏；主系统承载子应用时，宿主内容区在一屏内仍可能出现空滚动，影响页面稳定感与信任感。需要把这些壳层细节收敛成明确规范，避免后续视觉回退。

## What Changes

- 约束主应用桌面端导航分组以业务语义标签表达，不再依赖 `OA`、`S` 等前置域徽标帮助识别。
- 约束主应用在 `qiankun` 承载子应用时，宿主内容区与微应用挂载包装层不得凭空制造一层纵向滚动。
- 约束主应用与子应用侧边导航的滚动反馈默认保持隐藏，只在悬停或键盘聚焦时再显露，减少后台壳层视觉噪音。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `backoffice-super-app-shell`: 补充主应用导航分组命名与宿主内容区嵌入滚动行为约束。
- `backoffice-visual-language`: 补充后台侧边导航滚动反馈的收敛式视觉规则。

## Impact

- `apps/main-web` 的侧边导航与微应用挂载容器样式。
- `apps/oa-web` 与 `apps/scrm-web` 的嵌入态根节点与侧边导航样式。
- `openspec/specs/backoffice-super-app-shell/spec.md`
- `openspec/specs/backoffice-visual-language/spec.md`
