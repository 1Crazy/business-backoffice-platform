## Why

当前仓库的工程约定仍然默认只有一个前端应用：目录写死为 `apps/web`，工作区包名写死为 `@scrm/web`，根脚本、Docker、CI、架构校验和文档也都围绕这个单前端假设展开。既然接下来要新增 OA 等新的后台前端项目，就需要先把仓库升级成“支持多个前端应用的 monorepo”，否则第二个前端一落地，命名、脚本和规范都会立即分叉。

这个问题本质上是仓库级应用拓扑和命名约定还没有被正式建模。需要先明确“现有 SCRM 前端如何正名、未来新前端如何命名、仓库脚本和守卫如何从单前端泛化到多前端”，再进入 OA 的具体业务开发。

## What Changes

- 扩展仓库级架构规范，使前端工程约定从单一 `apps/web` 泛化为多个前端应用工作区，并明确每个前端应用都遵守同一套分层约束。
- 将现有 SCRM 前端从 `apps/web` 正名为 `apps/scrm-web`，并将工作区包名从 `@scrm/web` 调整为 `scrm-web`，为后续 `oa-web` 等前端应用预留清晰命名空间。
- 约定未来前端应用统一采用 `<domain>-web` 命名，而不是继续使用含糊的泛化目录名或带业务耦合的 `@scrm/*` 前缀。
- 更新根级脚本、Docker 编排、CI、开发文档和架构校验，使其能够识别命名化的前端应用，而不是继续默认只有一个 `web` 工作区。
- 明确本次 change 只解决“多前端应用支持”和“前端命名/工程约定”问题；后端仍保持当前单一 `apps/api` 模式，不在本次 change 中引入微服务拆分或独立 OA API。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codebase-architecture`: 将仓库的前端目录、脚本、守卫与命名规范从单前端 `apps/web` 扩展为支持多个前端工作区，并明确现有 SCRM 前端的正名方式。

## Impact

- Affected code:
  - `package.json`
  - `pnpm-lock.yaml`
  - `docker-compose.yml`
  - `scripts/architecture-check.cjs`
  - `README.md`
  - `docs/development.md`
  - `apps/web` -> `apps/scrm-web`
  - `.github/workflows/ci.yml`
- Affected APIs:
  - None
- Dependencies:
  - existing `pnpm` workspace layout under `apps/*`
  - existing Vite, Docker and CI workflows
- Systems:
  - monorepo application topology
  - frontend workspace naming conventions
  - local developer workflow and onboarding
  - future OA and other后台前端项目的接入路径
