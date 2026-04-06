## Context

当前仓库虽然在包管理层面已经允许 `apps/*` 工作区，但工程约定实际上仍然默认只有一个前端应用：

- 现有前端目录固定为 `apps/web`，工作区包名固定为 `@scrm/web`。
- 根脚本中的前端入口仍然使用 `dev:web` 和 `@scrm/web` 这样的单应用命名。
- `docker-compose.yml`、`README.md`、`docs/development.md`、CI 以及 `scripts/architecture-check.cjs` 都把“前端”视为唯一的 `apps/web`。
- `openspec/specs/codebase-architecture/spec.md` 中的前端规范和路径示例，也都把 `apps/web/src` 作为唯一落点。

这意味着仓库虽然“理论上可以再加一个 app”，但在命名、脚本、规范、校验和文档层面都还没有真正准备好支持第二个前端应用。若直接新增 `apps/oa-web`，很快就会出现两套并存但不一致的约定，例如：

- 一部分脚本继续叫 `dev:web`，另一部分脚本开始叫 `dev:oa-web`
- 一部分文档继续写 `apps/web/src/pages/...`，另一部分开始写 `apps/oa-web/src/pages/...`
- 架构校验只扫描旧 SCRM 前端，新 OA 前端实际上处于“无守卫”状态

因此本次 change 的核心不是新增 OA 业务，而是先把仓库正式升级成“多前端应用工作区”模型，并把当前 SCRM 前端正名为该模型下的第一个实例。

## Goals / Non-Goals

**Goals:**

- 将前端工作区约定从单一 `apps/web` 升级为支持多个 `apps/<domain>-web` 应用。
- 将现有 SCRM 前端重命名为 `apps/scrm-web`，并将工作区包名从 `@scrm/web` 调整为 `scrm-web`。
- 让根脚本、Docker、CI、文档和架构校验都使用显式的前端应用命名，而不是继续依赖模糊的 `web`。
- 保持每个前端应用内部继续遵守现有分层规则，如 `src/api`、`src/composables`、`src/pages/<domain>` 和 `@/` 根别名。
- 为后续新增 `oa-web` 等前端应用提供清晰、可复制、低歧义的接入路径。

**Non-Goals:**

- 不在本次 change 中实现 OA 的具体业务页面、路由或接口。
- 不在本次 change 中把后端从 `apps/api` 拆成多个独立 API 服务或微服务。
- 不在本次 change 中引入微前端、Module Federation 或运行时子应用加载机制。
- 不在本次 change 中抽离共享 UI/业务包；多个前端应用先以“各自完整、共享约定”为主，而不是过早共享实现。
- 不在本次 change 中系统性重命名整个仓库所有工作区包；本次只明确并落地前端工作区的命名规则。

## Decisions

### 1. 前端工作区统一采用 `apps/<domain>-web` 目录命名

Decision:
仓库中的每个后台前端应用都放在 `apps/<domain>-web` 目录下。现有 SCRM 前端从 `apps/web` 重命名为 `apps/scrm-web`，未来 OA 前端应使用 `apps/oa-web`，而不是继续新增类似 `apps/web2`、`apps/admin-web` 或继续保留一个模糊的 `apps/web`。

Rationale:

- 目录名直接表达业务归属，能消除“这个 web 到底是哪一个产品前端”的歧义。
- `apps/*` 现有 workspace 结构已经具备承载能力，无需引入新的 monorepo 布局。
- `<domain>-web` 规则足够简单，后续新增前端应用时无需重新发明命名。

Alternatives considered:

- 保留 `apps/web` 作为 SCRM 默认前端：短期改动最少，但会让未来的 `oa-web` 与 `web` 语义不对齐。
- 改成 `apps/frontends/<domain>`：层次更清晰，但超出当前仓库已有 `apps/*` 结构，迁移成本更高。
- 使用 `apps/<domain>-admin`：表达“后台”更直观，但会把具体技术形态和业务用途绑死在命名上，不如 `-web` 中性。

### 2. 前端工作区包名取消 `@scrm/*` 作用域，改为显式业务名

Decision:
前端工作区包名统一采用无作用域的显式业务名，例如 `scrm-web`、`oa-web`。现有前端包名从 `@scrm/web` 调整为 `scrm-web`。本次 change 不要求同步重命名后端包名，但前端侧不再继续使用 `@scrm/*` 命名模式。

Rationale:

- `@scrm/web` 暗含“仓库里只有 SCRM 这一个前端”的前提，不适合作为多前端工作区的长期命名规则。
- 使用 `scrm-web`、`oa-web` 这类直接名字后，根脚本和工作区过滤命令的可读性更高。
- 本次先收敛前端命名，能在不扩大变更范围的前提下解决最直接的歧义问题。

Alternatives considered:

- 保留 `@scrm/*` 并扩展为 `@scrm/oa-web`：在语义上仍然把 OA 等后续产品挂在 SCRM 名下，不够中性。
- 全部改成新的作用域，例如 `@apps/scrm-web`：长期也可行，但本次 change 的目标是先解耦业务前缀，而不是重新设计整个 npm scope 策略。
- 同步重命名后端包名：一致性更强，但会把本次变更扩大成整个 workspace 的命名重构。

### 3. 前端内部结构继续保持“每个应用一套完整分层”

Decision:
每个 `apps/<domain>-web` 应用内部继续使用当前前端分层约定：`src/api`、`src/composables`、`src/pages/<domain>`、`src/layout`、`src/stores`、`src/types`、`@/` 别名等。多前端支持通过“复制结构和规范”实现，而不是立刻引入共享运行时或共享业务包。

Rationale:

- 当前仓库已经有清晰的前端分层规范，推广到多个前端应用比重新设计一套共享目录更稳妥。
- 在 OA 尚未落地前，过早抽共享包很容易把未来差异化需求重新耦回一起。
- 每个前端应用先保持自洽，后续再根据真实重复度抽公共基础设施，风险更低。

Alternatives considered:

- 立刻新增共享 `packages/web-core`：看起来更平台化，但当前还缺乏经过多个前端验证的稳定抽象。
- 将多个前端做成单应用多路由：起步快，但会把产品边界、部署边界和工程边界重新耦在一起。

### 4. 根脚本、Docker 和 CI 使用显式前端应用命名

Decision:
根脚本和工程入口改成显式前端应用命名，例如 `dev:scrm-web`，并让 `dev:full` 明确表示“当前默认开发组合”，即 `apps/api + apps/scrm-web`。Docker 服务名和构建路径也使用显式业务名，而不是继续保留模糊的 `web`。CI 继续执行仓库级校验，但所有与前端相关的说明和过滤对象都必须落到命名后的工作区。

Rationale:

- 脚本名和服务名会成为团队日常沟通词汇，模糊命名会长期放大认知成本。
- `dev:full` 仍然保留一个“默认主路径”，但其组成对象必须是显式命名的应用。
- 未来增加 `oa-web` 时，只需并排补充 `dev:oa-web` 或其他组合脚本，而不是重写已有约定。

Alternatives considered:

- 继续保留 `dev:web` 作为 SCRM 别名：兼容性更好，但会让仓库长时间存在双轨命名。
- 将 `dev:full` 拆成多个固定组合脚本：表达更细，但当前仍以 SCRM 为主开发路径，没有必要一次铺太多组合。

### 5. 架构校验从硬编码 `apps/web` 改为扫描所有 `apps/*-web`

Decision:
架构校验脚本不再只扫描 `apps/web`，而是扫描所有符合前端命名约定的工作区目录，例如 `apps/scrm-web`、未来的 `apps/oa-web`。前端文件行数阈值、展示层越层请求和其他前端相关守卫必须对每个前端应用一致生效。

Rationale:

- 如果守卫只保护旧 SCRM 前端，那么新增 OA 前端时等于重新回到“无架构护栏”状态。
- 扫描目录模式化后，后续新增前端应用不需要再次改架构校验脚本的核心逻辑。
- 这也是把“支持多前端应用”从命名口号变成工程事实的关键一步。

Alternatives considered:

- 先只重命名目录，后续再补校验：迁移更快，但会留下明显的不一致窗口。
- 为每个前端单独维护一套校验脚本：可定制性高，但会带来重复维护成本。

### 6. 本次 change 保持后端拓扑不变

Decision:
`apps/api` 仍然保持当前唯一后端服务，不因前端工作区重构而同步拆分为 `scrm-api`、`oa-api` 或更细的微服务。本次 change 只为未来独立前端接入铺路，不提前引入后端拓扑复杂度。

Rationale:

- 当前问题的主要矛盾是前端应用命名和仓库工程约定，而不是后端服务边界。
- 先稳定多前端工作区模型，后续再根据 OA 的真实业务边界评估是否需要独立 API，会更符合 0 到 1 的演进顺序。
- 避免把一次仓库级命名与脚本调整扩散成前后端同时大改。

Alternatives considered:

- 同步把后端改名为 `scrm-api`：结构上更对称，但当前没有立即收益。
- 直接拆出 `oa-api`：为时过早，会让本次 change 偏离“支持多前端应用”的核心目标。

## Risks / Trade-offs

- [Risk] 目录重命名会触发大面积路径修改，短期 diff 较大 -> Mitigation: 将变更集中为一次显式 rename，并同步更新所有脚本、Docker、文档和校验，避免半迁移状态。
- [Risk] 去掉 `dev:web` 这类模糊命名会影响已有使用习惯 -> Mitigation: 在文档和 proposal 中把新的显式命名写清楚，并保留 `dev:full` 作为默认主入口。
- [Risk] 当前只处理前端包名，后端仍保留旧命名风格会形成阶段性不一致 -> Mitigation: 在设计中明确这是有意缩小范围的决策，而不是遗漏。
- [Risk] 架构校验改成扫描多个前端目录后，脚本复杂度会上升 -> Mitigation: 使用 `apps/*-web` 这种稳定模式收敛实现，避免为每个应用写分支。
- [Risk] 提前抽共享前端包的诱惑很大，后续容易把本次 change 扩大 -> Mitigation: 在规范中明确“先共享约定，再共享实现”，把抽公共包留给后续基于真实重复度的 change。

## Migration Plan

- 第一步：更新 `codebase-architecture` 规格，正式定义多前端工作区和显式前端命名规则。
- 第二步：将现有前端目录从 `apps/web` 重命名为 `apps/scrm-web`，并同步调整工作区包名与根脚本过滤目标。
- 第三步：更新 Docker、CI、README、开发文档和架构校验，移除对唯一 `apps/web` 的硬编码假设。
- 第四步：执行与工作区重命名相关的校验，至少确认开发脚本、构建脚本、测试入口和架构检查的目标路径都已收敛到新命名。
- 回滚策略：如果实施中出现不可接受的问题，可在一次提交中回退目录 rename 与相关引用更新；由于本次不涉及数据库或接口契约变更，回滚成本主要是工程路径恢复。

## Open Questions

- 后续如果新增 `oa-web`，是否需要在根脚本层提供 `dev:oa-full` 之类的组合入口，还是继续由团队按需补充。
- 当前前端应用之间是否会出现足够高的共享度，从而需要后续单独提出“抽共享前端基础设施包”的 change。
- 后端工作区包名是否也要在未来做一次独立的 workspace naming cleanup，以彻底移除 `@scrm/*` 风格。
