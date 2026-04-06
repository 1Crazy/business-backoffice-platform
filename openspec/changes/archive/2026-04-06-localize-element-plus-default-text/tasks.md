## 1. OpenSpec And Frontend Rules

- [x] 1.1 补齐 `localize-element-plus-default-text` 变更的 proposal、design、specs 和任务清单，明确 Element Plus 默认文案中文化的验收标准。
- [x] 1.2 更新 `openspec/specs/codebase-architecture/spec.md` 与 `docs/development.md`，要求前端共享组件库默认 locale 与后台中文界面保持一致。

## 2. Frontend Locale Implementation

- [x] 2.1 抽离 Element Plus 全局配置模块，并在 `apps/web/src/main.ts` 中接入中文 locale。
- [x] 2.2 盘点当前依赖 Element Plus 默认分页或表格空态文案的页面，确保不再出现英文 fallback，同时保留已有业务级中文空态。

## 3. Verification

- [x] 3.1 为全局 Element Plus 配置补一个可自动验证的前端测试点，覆盖中文 locale 的关键默认文案。
- [x] 3.2 执行 `pnpm --filter @scrm/web lint`、`pnpm --filter @scrm/web test`、`pnpm --filter @scrm/web build`，并处理本次改动引入的问题。
