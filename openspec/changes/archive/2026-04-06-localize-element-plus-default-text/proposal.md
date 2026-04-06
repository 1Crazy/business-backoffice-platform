## Why

当前前端虽然业务文案大多已经使用中文，但 Element Plus 仍然按默认配置挂载，导致分页器、表格空数据提示等组件级默认文案回退为英文。对后台系统来说，这会直接破坏界面的语言一致性，也会让用户误以为部分页面还没有完成本地化。

这个问题属于前端基础设施层，而不是单个页面的偶发疏漏。如果不在应用入口统一收敛组件库 locale，后续新增页面仍然会持续出现英文默认文案，需要反复在各处手工兜底。

## What Changes

- 扩展 `codebase-architecture` 规范，要求前端 UI 组件库默认文案与后台界面语言保持一致，当前仓库需统一为中文。
- 在前端应用入口为 Element Plus 注入中文 locale，收敛分页、表格空数据、日期等通用组件的默认文案。
- 盘点当前页面中依赖组件默认空态或分页文案的区域，确保不再出现英文 fallback。
- 为前端开发约定补充组件库本地化说明，并增加相应验证步骤，避免后续回退。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codebase-architecture`: 扩展前端基础设施约束，要求全局挂载的 UI 组件库默认 locale 与产品语言一致，避免 Element Plus 等共享组件回退为英文默认文案。

## Impact

- Affected code:
  - `apps/web/src/main.ts`
  - `apps/web/src/**/*.vue`
  - `docs/development.md`
  - `openspec/specs/codebase-architecture/spec.md`
- Affected APIs:
  - None
- Dependencies:
  - `element-plus` locale package
- Systems:
  - frontend application bootstrap
  - shared UI component localization consistency
