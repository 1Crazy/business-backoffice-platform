## Context

当前仓库已经同时具备本地开发和 Docker 编排能力，但这两条路径在命令层还没有被很好地区分。根目录只暴露了 `dev:api`、`dev:web` 和 `docker:up`，其中 `docker:up` 默认带 `--build`，更接近“完整容器化联调/验收”，却很容易被误用为日常开发入口。对于高频改前端或后端代码的场景，这会迫使开发者不断重建镜像，显著拉长反馈回路。

仓库其实已经具备更高效的开发基础：前端有 Vite 热更新，后端有 `ts-node-dev`，数据库也可以单独通过 Docker 提供。缺的不是底层能力，而是“把推荐工作流直接做成仓库入口”的最后一层抽象。

## Goals / Non-Goals

**Goals:**

- 为仓库提供清晰区分的开发入口：基础设施容器、本地热更新开发、全量 Docker 联调。
- 让开发者可以用一条命令并行启动本地前后端热更新服务，减少手工开多个终端的负担。
- 让“只起数据库容器”成为仓库级正式入口，避免为了本地开发误触全量重建镜像。
- 在 README 和开发文档中明确推荐工作流，降低新同事和未来自己再次踩坑的概率。

**Non-Goals:**

- 不在本次 change 中引入新的进程管理器、容器开发环境或 devcontainer 方案。
- 不改造当前全量 Docker 联调链路；`docker:up` 继续保留，用于近部署环境验证。
- 不重写 Dockerfile、compose 结构或把前后端改成源码 bind mount 的容器开发模式。

## Decisions

### 1. 根脚本显式拆分为“基础设施容器”和“本地全量开发”

Decision:

- 在根 `package.json` 中新增 `docker:infra`、`docker:infra:down`、`docker:infra:logs`，专门用于管理 PostgreSQL 容器。
- 新增 `dev:full`，用于在本地并行启动 API 和 Web 的热更新开发服务。

Rationale:

- 直接把推荐工作流编码成脚本，比只写文档更不容易被误用。
- 命令名里显式包含 `infra` 和 `full`，能降低“到底会不会重建镜像/会不会开容器”的歧义。

Alternatives considered:

- 继续只保留 `dev:api` / `dev:web` / `docker:up`：灵活但认知成本高，日常开发仍容易误走慢路径。
- 把 `docker:up` 改成不带 `--build`：能减少误伤，但仍无法表达“只起数据库”和“本地热更新”是推荐路径。

### 2. 复用 PNPM 原生并行能力，不为脚本引入新依赖

Decision:

- 给 `@scrm/api` 增加 `dev` 脚本别名，与 Web 一样统一成 `dev` 入口。
- 根目录的 `dev:full` 使用 `pnpm --parallel --stream --filter @scrm/api --filter @scrm/web run dev` 启动两个工作区。

Rationale:

- `pnpm` 已经支持递归并行脚本，足够覆盖当前场景，无需额外引入 `concurrently` 等依赖。
- 让 API 和 Web 在工作区层都拥有一致的 `dev` 语义，后续扩展多包开发也更自然。

Alternatives considered:

- 引入第三方并发脚本工具：实现也简单，但会增加依赖维护面。
- 在根脚本里直接写 shell 并发控制符：可用，但可读性和跨环境稳定性都不如复用 `pnpm` 原生机制。

### 3. `docker:infra:down` 只停止 PostgreSQL，而不是直接 `docker compose down`

Decision:

- `docker:infra:down` 使用只停止数据库容器的方式，而不是停止整个 compose 项目。

Rationale:

- 这个命令的目标是“关闭开发用数据库”，不应该顺手影响用户可能另外启动的 API/Web 容器。
- 开发者按命令名理解行为时，也更容易预期“infra down 只动基础设施”。

Alternatives considered:

- 直接复用 `docker compose down`：简单，但语义过大，容易误伤其他正在运行的容器。

### 4. 文档明确推荐三层工作流

Decision:

- README 与 `docs/development.md` 明确区分三种模式：
  - 日常开发：`pnpm docker:infra` + `pnpm dev:full`
  - 只改前端：`pnpm docker:infra` + `pnpm dev:web`
  - 联调/验收：`pnpm docker:up`

Rationale:

- 开发效率问题很多时候不是缺命令，而是默认路径不清晰。
- 把推荐工作流写到最常看的两个入口文档里，才能真正改变团队使用习惯。

Alternatives considered:

- 只在 README 写一句提醒：信息量不够，且容易被后续维护忽略。

## Risks / Trade-offs

- [Risk] `dev:full` 依赖本地已有可用数据库，如果开发者没先启动 PostgreSQL，API 可能启动失败 -> Mitigation: 文档显式把 `docker:infra` 放到推荐流程第一步，并在脚本命名上强调 infra 作用。
- [Risk] `docker:infra:down` 只停止 PostgreSQL，用户可能以为它会清理所有容器 -> Mitigation: 在 README 和开发文档中把它描述为“停止数据库容器”，并保留现有 `docker:down` 作为全量停机入口。
- [Risk] 根脚本新增后，开发者仍可能继续误用 `docker:up` 作为日常入口 -> Mitigation: 在文档中将 `docker:up` 明确标记为“联调/验收/近部署验证”而非默认开发流程。

## Migration Plan

- 第一步补齐 OpenSpec proposal、design、spec 和 tasks，明确新的仓库级工作流要求。
- 第二步为 API 增加统一的 `dev` 入口，并在根目录新增 `dev:full` 与 `docker:infra*` 脚本。
- 第三步更新 README 与开发文档，把推荐工作流改成“基础设施容器 + 本地热更新开发”。
- 第四步验证新脚本至少在语法和命令解析层可用，并同步更新任务状态。

## Open Questions

- 当前没有必须阻塞实现的未决问题；如果后续团队希望把 API/Web 的开发态也容器化，再单独提出新的 change 评估 bind mount、devcontainer 或 compose override 方案。
