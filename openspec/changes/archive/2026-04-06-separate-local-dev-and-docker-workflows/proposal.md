## Why

当前仓库同时提供了本地开发脚本和 Docker 全量编排，但入口语义还不够清晰：`docker:up` 会直接执行带 `--build` 的全量容器构建，而 README 也没有明确强调“日常开发优先本地热更新，Docker 更适合基础设施、联调和近部署验证”。这会让开发者误以为每次改前端或后端代码都应该重新打镜像，明显拖慢反馈速度。

这个问题本质上不是业务逻辑缺陷，而是仓库级开发工作流没有被明确建模。需要把“数据库容器”、“本地热更新开发”和“全量 Docker 联调”拆成更清晰的脚本与文档约定，让默认路径就是快的那条。

## What Changes

- 扩展 `codebase-architecture` 规范，要求仓库明确区分本地热更新开发工作流与全量 Docker 联调工作流。
- 新增只启动基础设施的根脚本，至少支持单独拉起 PostgreSQL，而不强制重建前后端镜像。
- 新增本地全量开发脚本，统一并行启动前后端热更新开发服务，减少开发者手动开多个终端的负担。
- 更新 README 与开发文档，明确推荐工作流：日常开发优先“Docker 跑数据库 + 本地跑 API/Web”，全量 Docker 主要用于联调、验收与接近部署环境的验证。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `codebase-architecture`: 扩展仓库级开发工作流约定，要求为基础设施容器、本地热更新开发和全量 Docker 联调提供清晰且低误用成本的入口。

## Impact

- Affected code:
  - `package.json`
  - `apps/api/package.json`
  - `README.md`
  - `docs/development.md`
  - `openspec/specs/codebase-architecture/spec.md`
- Affected APIs:
  - None
- Dependencies:
  - Reuse existing `pnpm` recursive/parallel script capabilities
- Systems:
  - local developer workflow
  - docker-based integration workflow
  - onboarding and day-to-day productivity
