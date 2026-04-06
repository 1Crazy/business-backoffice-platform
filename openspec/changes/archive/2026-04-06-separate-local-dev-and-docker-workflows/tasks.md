## 1. Workflow Spec And Documentation

- [x] 1.1 补齐 `separate-local-dev-and-docker-workflows` 变更的 proposal、design、specs 和任务清单，明确本地热更新开发与全量 Docker 联调的区别。
- [x] 1.2 更新 `openspec/specs/codebase-architecture/spec.md`、`README.md` 与 `docs/development.md`，将“日常开发优先本地热更新，Docker 主要用于基础设施和联调”写成正式约定。

## 2. Script Implementation

- [x] 2.1 在根 `package.json` 中新增基础设施容器脚本，例如只启动 PostgreSQL 的 `docker:infra` 及其配套停止、日志命令。
- [x] 2.2 在工作区脚本中补齐统一的 `dev` 入口，并新增根级 `dev:full`，支持并行启动 API 与 Web 的本地热更新服务。

## 3. Verification

- [x] 3.1 验证新增脚本的命令解析和推荐工作流说明没有冲突，至少确认本地开发脚本能够正确解析工作区命令。
- [x] 3.2 运行与本次改动相关的仓库级校验，并处理新增脚本或文档引入的问题。
