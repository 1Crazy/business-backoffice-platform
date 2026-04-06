## Why

当前仓库已经把“企业级可维护性”和“关键逻辑必须补充中文注释”写进了开发约定，但实现和校验并没有真正跟上。前端已经统一到 `@/` 根别名，后端仍大量保留多层 `../../` 相对路径；前后端复杂业务文件几乎没有中文维护注释；Swagger 也大多只有基础类型，缺少帮助接口使用者理解业务语义的中文说明。

如果继续在这个基础上叠加业务，路径风格会越来越分裂，复杂逻辑会越来越难审查和接手，接口文档也会停留在“能生成但不好用”的状态。需要把导入约定、中文注释和 Swagger 文档一起收敛为可执行、可校验的工程规范，而不是只留在口头要求里。

## What Changes

- 扩展 `codebase-architecture` 规范，要求后端 `apps/api/src` 内部跨层导入使用根别名而不是多层 `../` 相对路径。
- 为 `apps/api` 补齐 TypeScript、开发启动、测试和构建运行所需的 alias 配置，并收敛现有后端源文件中的多层相对导入。
- 明确前后端复杂业务逻辑、边界条件、兼容处理和非常规实现必须补充有维护价值的中文注释，避免代码只剩“能跑”而缺少上下文。
- 明确 Swagger 文档不仅要有基础类型声明，还要补充面向接口使用者的中文摘要、字段说明、关键枚举语义与必要示例。
- 为仓库级架构校验和 review checklist 增补 alias、中文注释和 Swagger 文档的检查点，防止后续迭代再次回退。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codebase-architecture`: 扩展仓库级架构规范，增加后端根别名、前后端中文注释和 Swagger 中文文档的约束与验收要求。

## Impact

- Affected code:
  - `apps/api/tsconfig.json`
  - `apps/api/tsconfig.build.json`
  - `apps/api/package.json`
  - `apps/api/jest.config.ts`
  - `apps/api/src/**/*.ts`
  - `apps/web/src/**/*.ts`
  - `apps/web/src/**/*.vue`
  - `docs/development.md`
  - `scripts/architecture-check.cjs`
  - `openspec/specs/codebase-architecture/spec.md`
- Affected APIs:
  - Swagger output for auth, customers, leads, users, departments, roles, dictionaries, uploads, dashboard and audit logs
- Dependencies:
  - NestJS Swagger decorators
  - TypeScript path alias resolution for build, dev and test flows
- Systems:
  - backend module import conventions
  - frontend and backend maintenance readability
  - local architecture review and CI guardrails
