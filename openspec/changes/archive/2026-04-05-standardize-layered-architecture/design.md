## Context

当前仓库的业务主流程已经可用，但工程结构已经出现比较明确的“胖页面 / 胖 service”模式，继续追加功能会持续放大阅读和修改成本：

- 治理前，前端核心页面曾出现明显的超长文件：`CustomersPage.vue` 823 行、`LeadsPage.vue` 816 行、`AccessControlPage.vue` 722 行、`SystemAdminPage.vue` 470 行、`AppLayout.vue` 314 行、`DashboardPage.vue` 257 行。
- 这些页面普遍在同一个 SFC 中同时承载表单状态、请求发起、payload 组装、成功/失败提示、分页筛选和弹窗抽屉编排；`RecordUploadPanel.vue` 这样的展示组件也直接导入 `http` 发请求。
- 后端 controller 当前基本保持“路由转发”职责，但 service 普遍直接注入 `PrismaService`，同时处理查询、事务、权限校验、审计、副作用和返回对象拼装；其中 `customers.service.ts` 396 行、`leads.service.ts` 357 行、`auth.service.ts` 305 行。
- 仓库目前的 `lint` 实际上只是 TypeScript 类型检查，没有结构层面的守卫，无法阻止超长文件、错误分层或越层依赖继续进入主干。

这意味着本次 change 不能只写一份文档，而需要定义一套可以渐进迁移的工程结构和守卫方式，让后续 feature 在“按规则长”而不是“继续堆在旧页面里”。

## Goals / Non-Goals

**Goals:**

- 让前端页面只承担页面组装和交互编排，把接口访问、数据转换和可复用状态拆到 `api`、`types`、`composables` 和子组件中。
- 为前端建立明确的复杂度边界，包括 SFC 250 行上限、模板表达式收敛和单方法职责收敛。
- 让后端形成清晰的 `controller -> service -> repository` 数据访问路径，并通过 DTO 与 VO/Response DTO 明确输入输出契约。
- 让跨模块依赖通过 Nest module export/import 管理，避免业务模块直接依赖其他模块的内部实现。
- 增加轻量但有效的工程守卫，至少覆盖超长文件、前端越层请求和后端越层 ORM 访问。
- 将“企业级可维护性”落成可执行标准，包括稳定命名、显式契约、低耦合结构、可测试职责边界和可渐进重构路径。

**Non-Goals:**

- 不在本次 change 中重做现有业务能力的产品流程、页面视觉或数据库领域模型。
- 不在本次 change 中把单体仓库拆成微前端、微服务或独立 BFF。
- 不在本次 change 中一次性重写全部模块；迁移将按高风险页面和高复杂度 service 分批完成。
- 不在本次 change 中引入沉重的新规范体系作为前置条件，例如一次性接入完整 ESLint 插件矩阵或复杂代码生成框架。
- 不追求为了“看起来架构很完整”而引入过度抽象；本次 change 只保留那些能直接提升可维护性的分层和契约。

## Decisions

### 1. 前端继续采用顶层分层目录，但在 `pages` 下按业务域建立页面目录

Decision:
保留当前 `apps/web/src/pages`、`api`、`types`、`composables`、`components` 的顶层目录语义，并在这些目录下按业务域补充分文件，而不是改成全新的 `features/*` 大迁移。

其中前端页面相关文件采用以下约定：

- `apps/web/src/pages/<domain>/<Domain>Page.vue` 作为路由页面壳层入口。
- `apps/web/src/pages/<domain>/components/*` 承载该页面私有的 section / dialog / drawer 组件。
- `apps/web/src/pages/<domain>/*.spec.ts` 与页面入口就近放置，减少页面增长后的查找成本。
- `apps/web/src` 内部的跨目录导入统一使用 `@/` 作为 `src` 根别名，而不是持续使用多层相对路径。

Rationale:

- 这套目录语义与用户给出的治理规则完全一致，沟通成本最低。
- 当前仓库已经有 `api/http.ts`、`types/entities.ts`、`composables/useViewport.ts` 等基础设施，沿现有结构细化能避免一次性路径重写。
- 页面入口、局部组件和同域测试就近归档后，随着页面数量继续增加，团队仍能快速定位某个界面的实现与验证文件。
- 使用 `@/` 根别名后，页面、layout、types 和 composables 之间的引用关系会更稳定，也更利于 code review 快速判断依赖方向。
- 目标是先把“职责边界”建立起来，再逐步做更大规模的文件归并或 feature 化。

Alternatives considered:

- 改成 `src/features/<domain>` 全量 feature 目录：封装性更强，但迁移范围更大，会把这次 change 变成路径重构而不是架构治理。
- 保持 `pages` 根目录平铺所有页面、spec 和局部组件：起步简单，但页面数量增长后会明显降低定位效率，也不利于页面级重构闭环。
- 保持现状，仅靠约定约束：改动最少，但无法解决当前超长页面和越层依赖问题。

### 2. 页面采用“Page Shell + Page Sections + Page Composables”拆分模式

Decision:
前端每个复杂页面拆成三层：

- `Page Shell`：页面路由组件，只负责组装 sections、对接路由参数和触发少量顶层交互。
- `Page Sections / Dialogs / Drawers`：展示和交互子组件，只通过 props / emits 交流，不直接请求接口。
- `Page Composables`：承载列表状态、表单状态、请求触发、数据刷新和提交流程编排。

接口请求统一通过 `api/<domain>.ts` 访问；请求入参、出参、表单模型和视图模型拆到 `types/<domain>.ts`；模板内的筛选、映射、三元表达式下沉为 `computed` 或展示辅助函数。

Rationale:

- 这种拆法能直接对应当前最重页面的症状：Customers、Leads 和 Access Control 都同时混合了表格、弹窗、抽屉和提交逻辑。
- 通过 `Page Composables` 可以把“请求 + 刷新 + 错误提示策略”集中，而不是复制在多个按钮方法中。
- 子组件禁止请求接口后，`RecordUploadPanel`、列表工具栏、表单对话框就能真正变成可复用展示单元。

Alternatives considered:

- 只拆模板，不拆逻辑：会让 `<script setup>` 继续膨胀，复杂度只是从模板转移到单文件脚本。
- 只引入 store 承载所有页面状态：全局 store 不适合管理一次性弹窗、抽屉和表单局部状态，反而会增加耦合。

### 3. 前端复杂度采用“硬阈值 + 结构化拆分”联合治理

Decision:
对新建或大幅修改的前端文件引入以下治理边界：

- 单个 Vue SFC 超过 250 行必须拆分。
- 模板禁止内联复杂表达式，复杂筛选/映射/条件分支必须提取为 `computed`、辅助函数或 props。
- 单个提交方法不得同时包含“请求发送、payload 归一化、UI 提示、路由跳转”四类职责；至少拆分为 payload mapper、use-case/composable action 和页面级反馈/导航协作。

Rationale:

- 当前最难维护的页面恰好都在这三个维度同时失控：文件过长、模板表达式复杂、提交方法职责过多。
- 行数阈值本身不解决设计问题，但可以强制团队在问题继续累积之前拆分。
- 将职责拆开后，单测和交互测试可以落到 payload 构造、请求动作和页面反馈三个层面，不必在一个函数里做全链路断言。

Alternatives considered:

- 只靠 code review 主观判断：执行成本低，但很容易随迭代节奏退化。
- 直接引入完整自定义 ESLint 规则：长期更强，但对当前仓库是过重起步，可以在结构稳定后再补。

### 4. 后端模块采用“Controller -> Service -> Repository -> Prisma”路径

Decision:
后端每个业务模块在现有 `dto` 基础上补齐 `repository` 和 `vo`/`responses`（必要时加 `mapper`）：

- `controller`：仅负责路由声明、参数接收、鉴权注解和调用 service。
- `service`：负责业务编排、事务边界、权限协作和跨模块调用，不直接操作 ORM。
- `repository`：模块内唯一允许注入 `PrismaService` 的层，负责查询、持久化和数据库事务细节。
- `dto`：仅用于入参校验和类型约束。
- `vo` / `response dto`：定义对外返回契约；`mapper` 负责把 repository 返回结果转换成对外对象。

Rationale:

- 当前 controller 已经较薄，补 repository 和 response mapping 可以最大程度复用现有路由层。
- 将 Prisma 访问集中到 repository 后，service 的阅读重点会回到“业务在做什么”，而不是“SQL 细节长什么样”。
- 明确返回契约后，Swagger 文档、测试断言和前端类型可以围绕稳定对象结构协作，而不是隐式依赖 Prisma include 结果。

Alternatives considered:

- 继续由 service 直接访问 Prisma：短期改动少，但无法满足用户给出的 repository 规则。
- 在 controller 中做 response mapping：controller 会重新变厚，不利于保持 transport-only 边界。

### 5. 返回对象统一走显式 VO/Response DTO，而不是裸露实体

Decision:
所有 create / update / detail / list 接口逐步统一为“repository 返回持久化对象，service 通过 mapper 产出 VO/Response DTO，再由 controller 直接返回该契约”。禁止直接把 Prisma entity/include 结果作为接口返回值暴露。

Rationale:

- 当前虽然部分列表接口已经定义 Swagger response DTO，但实现层仍大量直接返回 Prisma 查询结果，文档和真实返回对象之间没有硬边界。
- VO/Response DTO 能把“数据库字段怎么存”和“接口怎么暴露”拆开，为后续字段裁剪、命名调整和兼容处理留出空间。
- 统一返回契约后，前端 `types` 可以跟随接口定义按域拆分，而不是继续维护一个不断膨胀的 `entities.ts`。

Alternatives considered:

- 只保留 Swagger DTO 注解，不做实际映射：文档好看，但运行时仍暴露持久化实现。
- 直接把 Prisma 类型导给前端：实现快，但会把数据库结构耦合到整个调用链。

### 6. 架构守卫优先采用轻量脚本与评审清单，而不是一次性引入重型规范栈

Decision:
仓库新增轻量架构校验，至少覆盖以下规则：

- 检查前端 `.vue` 文件行数阈值。
- 禁止 `pages`、`layout`、`components` 直接导入 `api/http`。
- 禁止展示组件直接发请求。
- 禁止 `controller` 直接使用 Prisma/ORM。
- 限制 `PrismaService` 只在 repository 层出现。

这些校验以仓库脚本和 CI 入口为主，同时补一份开发文档中的“架构 review checklist”，用于处理暂时无法完全静态检测的规则，例如“模板复杂表达式”和“单方法职责过多”。

Rationale:

- 当前 `lint` 只是类型检查，补一个轻量脚本比引入完整 lint 生态更快落地。
- 行数、导入边界和 Prisma 使用位置都非常适合做静态扫描，能在低成本下先挡住最常见回归。
- 对于还需要人工判断的规则，用 checklist 先固化标准，比等待完美自动化更务实，也更符合企业级维护中“规则可审计、例外可讨论”的治理方式。

Alternatives considered:

- 完全不做自动守卫：规范会快速失效。
- 直接引入大而全的 ESLint/AST 体系：长期更精确，但会显著拉长本次 change 的交付时间。

## Risks / Trade-offs

- [Risk] 文件数量会显著增加，短期内目录浏览成本会上升 -> Mitigation: 采用稳定命名约定（`<domain>.api.ts`、`use<Domain>*.ts`、`<Domain>*Section.vue`、`pages/<domain>/`）并按业务域分组。
- [Risk] 迁移期间会出现“新旧风格并存”的混合状态 -> Mitigation: 以模块为单位重构，要求被触达的高风险文件在本次提交内完成同层闭环，不留下半迁移的方法。
- [Risk] repository + mapper 会带来额外样板代码 -> Mitigation: 仅在业务边界处引入，复用共享分页/映射辅助函数，优先治理复杂模块而不是简单 CRUD 全量铺开。
- [Risk] 前端把逻辑拆到 composables 后，命名不清反而造成跳转阅读 -> Mitigation: 约定 composable 以场景命名，例如 `useCustomersList`, `useCustomerDialogs`, `useLeadFollowUps`，避免“万能 usePage”。
- [Risk] 纯静态脚本无法判断所有“复杂表达式”或“职责过多”场景 -> Mitigation: 将可静态检查的规则先自动化，其余规则通过 PR checklist 和 code review 强制执行。
- [Risk] 为追求规范而引入过多包装层，导致开发体验下降 -> Mitigation: 仅保留能清晰降低耦合、提升测试性和阅读性的层次，不为简单场景制造空壳抽象。

## Migration Plan

- 第一步建立共享约定与守卫：补充前端/后端目录约定、`@/` 根别名约定、架构校验脚本和 review checklist。
- 第二步优先拆分当前最高风险前端页面：`CustomersPage`、`LeadsPage`、`AccessControlPage`、`SystemAdminPage`、`DashboardPage`、`LoginPage` 和 `AppLayout`，并把页面入口、同域测试、局部组件归档到 `pages/<domain>/` 下，同时把 `RecordUploadPanel` 改造成纯展示/交互组件。
- 第三步补齐后端 repository 和 response mapping，优先覆盖 `auth`、`customers`、`leads`、`uploads`、`users`、`roles`、`departments`、`dictionaries` 等直接被前端核心页面依赖的模块。
- 第四步按模块更新测试，确保页面交互测试与后端接口测试围绕新的分层边界断言。
- 第五步将架构校验并入仓库级 `lint`/CI 流程，并补充维护约定文档，让后续 feature 默认受到同一套企业级可维护性约束。

## Open Questions

- 返回契约目录名统一使用 `vo` 还是 `responses`，需要在仓库内选一个术语以避免双轨并存。
- service 中的业务异常是否在本次一并抽象为领域错误，还是先允许保留少量 Nest 异常并在后续 change 再统一。
- 架构守卫脚本是否直接接入现有 `lint` 脚本，还是先作为独立 `pnpm architecture:check` 命令运行。
