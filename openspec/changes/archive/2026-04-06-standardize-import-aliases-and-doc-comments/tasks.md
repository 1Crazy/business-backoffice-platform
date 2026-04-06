## 1. Backend Alias Foundation

- [x] 1.1 为 `apps/api` 补齐 `@/` 根别名配置，并让开发、seed、测试和构建后的运行链路都能解析该别名。
- [x] 1.2 将 `apps/api/src` 中两层及以上的相对路径导入收敛为 `@/` 根别名，并为该规则补充仓库级校验。

## 2. Chinese Comments And Swagger Documentation

- [x] 2.1 为后端共享基础设施、controller、service、repository、mapper、DTO、VO 等核心文件补充中文职责说明和关键业务注释。
- [x] 2.2 为前端页面壳层、核心 composable、store、api 与关键复用组件补充中文职责说明和边界条件注释。
- [x] 2.3 为 controller、DTO、VO/Response DTO 补齐 Swagger 中文摘要、字段说明和关键枚举/时间语义说明。

## 3. Guardrails And Verification

- [x] 3.1 更新 `docs/development.md` 与 `openspec/specs/codebase-architecture/spec.md`，明确后端 alias、中文注释和 Swagger 中文说明的规则。
- [x] 3.2 完成一次仓库级验证，执行 `pnpm architecture:check`、`pnpm --filter @scrm/api lint`、`pnpm --filter @scrm/api test`、`pnpm --filter @scrm/api build`，并处理本次治理引入的问题。
