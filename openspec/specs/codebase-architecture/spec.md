# codebase-architecture Specification

## Purpose
定义前后端分层、职责边界与仓库级架构守卫，确保新增或重构代码以可维护、低耦合、可测试的标准进入主干。

## Requirements
### Requirement: 前端页面遵守组装与数据访问分层
对于新建或被大幅修改的前端页面，系统实现 SHALL 让页面组件只负责页面组装、路由上下文对接和少量顶层交互编排。所有接口请求 SHALL 下沉到 `api` 层，可复用状态与业务逻辑 SHALL 下沉到 `composables`，展示组件 MUST NOT 直接请求接口或依赖底层 `http` 客户端。复杂页面相关文件 SHALL 归档到 `apps/web/src/pages/<domain>/` 目录，同域页面入口、页面局部组件和同域测试 SHOULD 就近 colocate。`apps/web/src` 内部导入 SHALL 使用 `@/` 作为 `src` 根别名，而不是跨层相对路径。

#### Scenario: 页面通过 composable 组装客户列表
- **WHEN** 开发者新增或重构客户、线索、权限等业务页面
- **THEN** 页面组件仅组合 section/dialog/drawer 组件并调用对应 composable，而不在页面文件内直接发起底层 HTTP 请求

#### Scenario: 展示组件通过 props 与 emits 协作
- **WHEN** 一个附件面板、过滤栏或表格组件需要被多个页面复用
- **THEN** 该组件通过 props 接收数据、通过 emits 暴露交互，并且不直接导入 `api/http` 或自行请求接口

#### Scenario: 页面文件按业务域归档
- **WHEN** 开发者为客户、线索、权限或系统管理页面新增局部组件、测试或路由入口
- **THEN** 这些文件位于对应的 `apps/web/src/pages/<domain>/` 目录中，而不是继续平铺在 `apps/web/src/pages` 根目录

#### Scenario: 前端源文件使用根别名导入
- **WHEN** 页面、layout、types、stores 或 composables 需要引用 `apps/web/src` 下的其他模块
- **THEN** 实现使用 `@/` 开头的导入路径，而不是包含多层 `../` 的相对路径

### Requirement: 前端共享组件默认文案与后台界面语言一致
对于全局挂载的前端 UI 组件库，系统实现 SHALL 在应用启动层统一配置默认 locale，使分页、表格空数据提示、日期和其他共享组件默认文案与后台界面主语言保持一致。当前仓库的后台主语言为中文，因此默认 fallback 文案 MUST 以中文呈现，而不是回退为英文。

#### Scenario: Element Plus 默认分页文案显示为中文
- **WHEN** 页面使用 `el-pagination` 且未手工覆写其默认提示文案
- **THEN** 分页器展示的总数、跳转或每页条数等默认文本以中文呈现

#### Scenario: Element Plus 默认表格空态显示为中文
- **WHEN** 页面直接渲染 `el-table` 且数据为空，并依赖组件默认空态提示
- **THEN** 表格显示中文空数据提示，而不是英文的 `No Data`

#### Scenario: 业务级空态文案优先于组件默认 fallback
- **WHEN** 页面已经显式声明更具体的业务空态，例如筛选结果为空、暂无待办或暂无附件
- **THEN** 实现保留这些业务级中文文案，而不是被统一默认文案覆盖

### Requirement: 后端源文件使用根别名导入
对于新建或被大幅修改的后端源文件，`apps/api/src` 内部的跨目录依赖 SHALL 使用 `@/` 作为 `src` 根别名，而不是继续使用两层及以上的相对路径回退。`./` 与单层 `../` 在局部近邻引用场景中 MAY 保留，但出现多层回退时 MUST 收敛到根别名。

#### Scenario: 后端 service 引用共享能力时使用根别名
- **WHEN** service、controller、repository、mapper 或 vo 需要引用 `apps/api/src/common` 或其他业务模块中的文件
- **THEN** 两层及以上目录回退的导入被替换为 `@/` 开头的根别名，而不是 `../../` 或 `../../../` 形式

#### Scenario: 后端工具链支持根别名
- **WHEN** 开发者运行后端开发服务器、测试、seed 脚本或构建后的产物
- **THEN** 这些运行入口都能够正确解析 `@/` 根别名，而不会因 alias 丢失导致启动失败

### Requirement: 前端文件与模板复杂度受到硬边界约束
对于新建或被大幅修改的前端 Vue 文件，单个 SFC SHALL 保持在 250 行以内；超过该阈值时 MUST 拆分为页面壳层、子组件或 composable。模板 MUST NOT 包含复杂表达式，复杂筛选、映射、格式化和条件分支 SHALL 提取为 `computed`、辅助函数或明确的 props。单个方法 MUST NOT 同时承担请求发送、数据转换、UI 提示和路由跳转等多类职责。

#### Scenario: 超长页面在合并前被拆分
- **WHEN** 某个页面组件在迭代中增长到 250 行以上
- **THEN** 该页面在合并前被拆分为更小的展示组件或 composable，而不是继续向同一 SFC 追加业务逻辑

#### Scenario: 模板中的复杂逻辑被下沉
- **WHEN** 页面需要根据多重条件决定按钮文案、筛选结果或显示状态
- **THEN** 这些逻辑被提取到 `computed`、辅助函数或组件输入中，而不是以内联三元表达式、过滤链或映射链直接写在模板里

#### Scenario: 提交流程按职责拆开
- **WHEN** 一个表单提交既需要归一化 payload、调用接口、提示结果并根据结果跳转页面
- **THEN** 实现将这些职责拆分到 mapper、api/composable action 与页面导航协作中，而不是由单一方法一次性处理

### Requirement: 后端模块遵守 controller-service-repository 分层
对于新建或被大幅修改的后端模块，controller SHALL 仅负责路由、参数接收、鉴权注解和调用 service；service SHALL 负责业务编排、事务边界和跨模块协作；repository SHALL 成为模块内唯一允许直接访问 ORM/Prisma 的层。controller MUST NOT 直接操作 ORM。

#### Scenario: Controller 只转发业务请求
- **WHEN** 开发者为客户、线索、用户或字典模块新增一个接口
- **THEN** controller 只接收 DTO、路径参数和当前用户上下文，并将业务处理委托给对应 service

#### Scenario: Repository 封装数据库读写
- **WHEN** service 需要分页查询、写入事务或装载关联数据
- **THEN** 这些数据库访问细节由 repository 完成，而不是在 service 中直接调用 Prisma 查询

#### Scenario: Controller 不直接依赖 ORM
- **WHEN** controller 需要读取或更新数据库记录
- **THEN** 它通过 service 暴露的用例完成，而不会注入 `PrismaService`、调用模型查询或拼装数据库事务

### Requirement: 后端输入输出与跨模块依赖使用显式契约
对于新建或被大幅修改的后端模块，DTO SHALL 只负责入参校验与类型约束；公开接口返回值 SHALL 使用 VO/Response DTO，而不是直接暴露 Entity 或 ORM 查询结果。所有跨模块依赖 SHALL 通过 Nest module 的 export/import 管理，并依赖被导出的服务契约，而不是直接引用其他模块的内部实现。

#### Scenario: 详情接口返回显式响应对象
- **WHEN** controller 返回客户详情、线索详情或登录结果
- **THEN** 返回对象遵循该模块定义的 VO/Response DTO 契约，而不是直接返回 ORM entity/include 结果

#### Scenario: DTO 仅处理输入约束
- **WHEN** 开发者为创建、更新或筛选接口新增 DTO
- **THEN** DTO 仅承载校验规则与输入类型，不混入数据库访问、响应整形或业务副作用

#### Scenario: 跨模块协作通过导出服务完成
- **WHEN** 一个业务模块需要依赖另一个模块的能力
- **THEN** 它通过对方 module 导出的 service 契约访问该能力，而不是直接导入对方 repository 或其他内部文件

### Requirement: 前后端复杂逻辑与接口契约提供中文说明
对于新建或被大幅修改的前后端核心业务文件，复杂业务规则、边界条件、兼容处理、空值归一化和非常规实现 SHALL 提供有维护价值的中文注释，说明文件职责和关键决策原因。Swagger controller、DTO 和 VO/Response DTO SHALL 提供中文摘要或字段说明，帮助接口使用者理解业务语义，而不是只暴露类型结构。

#### Scenario: 复杂业务分支补充中文维护注释
- **WHEN** service、composable、store、api 层或共享基础设施中存在非直观规则、兼容逻辑或副作用流程
- **THEN** 实现包含准确的中文职责说明或关键分支注释，解释为什么需要这些处理

#### Scenario: Swagger 契约提供中文语义说明
- **WHEN** controller 暴露接口或 DTO、VO 定义输入输出字段
- **THEN** Swagger 文档包含中文 `summary`、`description` 或字段说明，使接口读者无需回到源码猜测字段用途和限制

### Requirement: 仓库提供清晰区分的本地开发与容器联调入口
仓库 SHALL 为基础设施容器、本地热更新开发和全量 Docker 联调提供清晰且低误用成本的脚本入口。日常开发路径 MUST 支持在不重建前后端镜像的情况下启动数据库与本地开发服务，而全量 Docker 工作流 MAY 继续保留用于联调、验收和近部署环境验证。

#### Scenario: 开发者只启动数据库容器
- **WHEN** 开发者需要本地热更新开发前后端，但数据库尚未启动
- **THEN** 仓库提供只启动 PostgreSQL 基础设施容器的脚本入口，而不是强制构建并启动整套前后端镜像

#### Scenario: 开发者一条命令启动本地热更新服务
- **WHEN** 开发者需要同时修改前端与后端代码
- **THEN** 仓库提供能够并行启动 API 与 Web 本地开发服务的统一脚本入口，而不要求开发者手动记忆并分别执行多个命令

#### Scenario: 全量 Docker 联调入口仍然保留
- **WHEN** 开发者需要验证接近部署环境的整套容器化启动流程
- **THEN** 仓库仍然保留全量 Docker 编排入口，并在文档中将其标记为联调、验收或近部署验证路径，而不是默认日常开发路径

### Requirement: 仓库在合并前校验关键架构边界
仓库 SHALL 提供可在本地和 CI 中运行的架构校验机制，用于在代码合并前发现关键结构违规。该校验至少 MUST 覆盖前端文件行数阈值、展示层越层请求、controller 越层 ORM 访问、Prisma 使用位置限制以及后端多层相对导入回退；对于暂时无法静态检查的复杂度规则、中文注释质量与 Swagger 说明完整度，仓库 SHALL 提供明确的 review checklist。该机制 MUST 以企业级可维护性为目标，覆盖稳定命名、职责单一、低耦合、可测试性和文档可读性等基础要求。

#### Scenario: 违规导入在校验中被阻止
- **WHEN** 展示组件或页面直接导入底层 HTTP 客户端、controller 直接使用 Prisma，或者后端源文件新增两层及以上的相对路径回退导入
- **THEN** 架构校验在本地或 CI 中标记失败，阻止该变更无提示地进入主干

#### Scenario: 人工 review 覆盖静态脚本难以判断的规则
- **WHEN** 一个改动涉及模板复杂表达式、方法职责边界、中文注释质量或 Swagger 说明完整度
- **THEN** 开发者和评审者依据仓库内的架构 checklist 逐项确认这些规则已经满足

#### Scenario: 新代码以可维护性标准进入主干
- **WHEN** 团队新增或重构一个业务模块
- **THEN** 该模块在命名、分层、契约、注释和测试入口上满足仓库定义的企业级可维护性标准，而不是仅仅“功能可用”
