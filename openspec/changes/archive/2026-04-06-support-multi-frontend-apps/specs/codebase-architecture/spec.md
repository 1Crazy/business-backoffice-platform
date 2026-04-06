## ADDED Requirements

### Requirement: 仓库支持多个命名化前端应用工作区
仓库 SHALL 支持在 `apps/` 目录下维护多个命名化前端应用工作区。每个前端应用目录 MUST 使用 `apps/<domain>-web` 形式命名，前端工作区包名 MUST 使用显式业务名，例如 `scrm-web`、`oa-web`，而不是继续使用含糊的 `web` 目录名或带 `@scrm/*` 前缀的前端包名。当前存量 SCRM 前端 MUST 迁移到 `apps/scrm-web` 并使用 `scrm-web` 作为工作区包名。

#### Scenario: 现有 SCRM 前端按新规则正名
- **WHEN** 团队将当前唯一的后台前端纳入多前端工作区模型
- **THEN** 该前端位于 `apps/scrm-web`，并使用 `scrm-web` 作为工作区包名，而不是继续保留 `apps/web` 或 `@scrm/web`

#### Scenario: 新增 OA 前端遵循统一命名规则
- **WHEN** 团队后续新增 OA 或其他后台前端应用
- **THEN** 新应用使用 `apps/<domain>-web` 目录和对应的显式前端包名，而不是重新定义另一套目录和包名规则

## MODIFIED Requirements

### Requirement: 前端页面遵守组装与数据访问分层
对于新建或被大幅修改的前端页面，系统实现 SHALL 让页面组件只负责页面组装、路由上下文对接和少量顶层交互编排。所有接口请求 SHALL 下沉到应用内的 `api` 层，可复用状态与业务逻辑 SHALL 下沉到应用内的 `composables`，展示组件 MUST NOT 直接请求接口或依赖底层 `http` 客户端。复杂页面相关文件 SHALL 归档到对应前端应用的 `apps/<app>-web/src/pages/<domain>/` 目录，同域页面入口、页面局部组件和同域测试 SHALL 就近 colocate。每个前端应用的 `apps/<app>-web/src` 内部导入 SHALL 使用 `@/` 作为该应用 `src` 根别名，而不是跨层相对路径。

#### Scenario: 页面通过 composable 组装客户列表
- **WHEN** 开发者在任一前端应用中新增或重构客户、线索、权限等业务页面
- **THEN** 页面组件仅组合 section/dialog/drawer 组件并调用对应 composable，而不在页面文件内直接发起底层 HTTP 请求

#### Scenario: 展示组件通过 props 与 emits 协作
- **WHEN** 一个附件面板、过滤栏或表格组件需要在同一前端应用内被多个页面复用
- **THEN** 该组件通过 props 接收数据、通过 emits 暴露交互，并且不直接导入 `api/http` 或自行请求接口

#### Scenario: 页面文件按业务域归档
- **WHEN** 开发者为任一前端应用中的客户、线索、权限或系统管理页面新增局部组件、测试或路由入口
- **THEN** 这些文件位于对应应用的 `apps/<app>-web/src/pages/<domain>/` 目录中，而不是继续平铺在该应用的 `apps/<app>-web/src/pages` 根目录

#### Scenario: 前端源文件使用根别名导入
- **WHEN** 页面、layout、types、stores 或 composables 需要引用同一前端应用 `apps/<app>-web/src` 下的其他模块
- **THEN** 实现使用 `@/` 开头的导入路径，而不是包含多层 `../` 的相对路径

### Requirement: 仓库提供清晰区分的本地开发与容器联调入口
仓库 SHALL 为基础设施容器、本地热更新开发和全量 Docker 联调提供清晰且低误用成本的脚本入口。日常开发路径 MUST 支持在不重建前后端镜像的情况下启动数据库与本地开发服务，而全量 Docker 工作流 SHALL 继续保留用于联调、验收和近部署环境验证。当前仓库在存在多个前端应用时，前端相关脚本与容器入口 MUST 使用显式应用命名，而不是继续使用模糊的单一 `web` 指代所有前端。

#### Scenario: 开发者只启动数据库容器
- **WHEN** 开发者需要本地热更新开发前后端，但数据库尚未启动
- **THEN** 仓库提供只启动 PostgreSQL 基础设施容器的脚本入口，而不是强制构建并启动整套前后端镜像

#### Scenario: 开发者启动显式命名的前端应用
- **WHEN** 开发者需要启动当前 SCRM 前端或未来其他前端应用
- **THEN** 仓库提供带显式应用名的脚本入口，例如 `dev:scrm-web`，而不是继续要求开发者通过语义不清的 `dev:web` 推断目标应用

#### Scenario: 默认全量开发入口仍然表达主路径
- **WHEN** 开发者需要快速启动当前默认的本地联调组合
- **THEN** 仓库仍可保留统一入口，例如 `dev:full`，但该入口指向的前端和后端组成在脚本和文档中被显式说明

#### Scenario: 全量 Docker 联调入口仍然保留
- **WHEN** 开发者需要验证接近部署环境的整套容器化启动流程
- **THEN** 仓库仍然保留全量 Docker 编排入口，并在文档中将其标记为联调、验收或近部署验证路径，而不是默认日常开发路径

### Requirement: 仓库在合并前校验关键架构边界
仓库 SHALL 提供可在本地和 CI 中运行的架构校验机制，用于在代码合并前发现关键结构违规。该校验至少 MUST 覆盖所有前端应用工作区中的前端文件行数阈值、展示层越层请求、controller 越层 ORM 访问、Prisma 使用位置限制以及后端多层相对导入回退；对于暂时无法静态检查的复杂度规则、中文注释质量与 Swagger 说明完整度，仓库 SHALL 提供明确的 review checklist。该机制 MUST 以企业级可维护性为目标，覆盖稳定命名、职责单一、低耦合、可测试性和文档可读性等基础要求。

#### Scenario: 第二个前端应用也受到相同守卫
- **WHEN** 团队在 `apps/scrm-web` 之外新增另一个符合命名规则的前端应用
- **THEN** 架构校验同样扫描该前端应用，并对越层请求、超长文件等违规行为给出失败结果

#### Scenario: 违规导入在校验中被阻止
- **WHEN** 任一前端应用中的展示组件或页面直接导入底层 HTTP 客户端、controller 直接使用 Prisma，或者后端源文件新增两层及以上的相对路径回退导入
- **THEN** 架构校验在本地或 CI 中标记失败，阻止该变更无提示地进入主干

#### Scenario: 人工 review 覆盖静态脚本难以判断的规则
- **WHEN** 一个改动涉及模板复杂表达式、方法职责边界、中文注释质量或 Swagger 说明完整度
- **THEN** 开发者和评审者依据仓库内的架构 checklist 逐项确认这些规则已经满足

#### Scenario: 新代码以可维护性标准进入主干
- **WHEN** 团队新增或重构一个业务模块或新的前端应用
- **THEN** 该模块或应用在命名、分层、契约、注释和测试入口上满足仓库定义的企业级可维护性标准，而不是仅仅“功能可用”
