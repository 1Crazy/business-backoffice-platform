# codebase-architecture Specification

## Purpose
定义前后端分层、职责边界与仓库级架构守卫，确保新增或重构代码以可维护、低耦合、可测试的标准进入主干。
## Requirements
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

### Requirement: 仓库支持多个命名化前端应用工作区
仓库 SHALL 支持在 `apps/` 目录下维护多个命名化前端应用工作区。每个前端应用目录 MUST 使用 `apps/<domain>-web` 形式命名，前端工作区包名 MUST 使用显式业务名，例如 `scrm-web`、`oa-web`，而不是继续使用含糊的 `web` 目录名或带 `@scrm/*` 前缀的前端包名。当前存量 SCRM 前端 MUST 迁移到 `apps/scrm-web` 并使用 `scrm-web` 作为工作区包名。

#### Scenario: 现有 SCRM 前端按新规则正名
- **WHEN** 团队将当前唯一的后台前端纳入多前端工作区模型
- **THEN** 该前端位于 `apps/scrm-web`，并使用 `scrm-web` 作为工作区包名，而不是继续保留 `apps/web` 或 `@scrm/web`

#### Scenario: 新增 OA 前端遵循统一命名规则
- **WHEN** 团队后续新增 OA 或其他后台前端应用
- **THEN** 新应用使用 `apps/<domain>-web` 目录和对应的显式前端包名，而不是重新定义另一套目录和包名规则

### Requirement: 共享后端工作区使用中性且显式的包名
对于承载多个后台应用共享能力的后端工作区，仓库 SHALL 使用中性且显式的包名，而不是继续沿用某一个具体业务域的作用域前缀。当前共享后端位于 `apps/api`，其工作区包名 MUST 使用 `platform-api` 这类能够表达平台共享语义的名称，而不是继续保留 `@scrm/api` 一类只适用于单一业务前提的命名。

#### Scenario: 默认共享后端以平台语义命名
- **WHEN** 团队在根脚本、Docker 构建、开发命令或文档中引用 `apps/api` 工作区
- **THEN** 这些入口统一使用 `platform-api` 等中性显式名称，而不是继续引用 `@scrm/api`

#### Scenario: 后续新增独立后端服务时保持命名可扩展
- **WHEN** 团队未来新增其他后端工作区或服务
- **THEN** 其包名遵循中性、显式且可扩展的命名原则，不把所有共享后端能力都挂在单一业务域前缀之下

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

### Requirement: qiankun 主应用与子应用边界清晰可维护
对于采用 `qiankun` 集成的前端工作区，仓库 SHALL 明确区分主应用壳层职责与子应用业务职责。主应用 MUST 负责菜单注册、子应用加载、统一登录入口与页面级壳层；子应用 MUST 负责本域页面、路由守卫、API 调用与领域 UI，不得把宿主菜单、宿主布局或其他子应用实现细节反向耦合进自身代码。

#### Scenario: 主应用不直接导入子应用业务源码
- **WHEN** 团队实现 `main-web` 对 `oa-web` 与 `scrm-web` 的集成
- **THEN** 主应用通过 `qiankun` 注册和路由前缀承载子应用，而不是直接跨工作区导入子应用页面、composable 或 API 源码

#### Scenario: 子应用的微前端特判集中在运行时层
- **WHEN** 子应用需要判断当前是否运行在 `qiankun` 宿主中
- **THEN** 该判断被收敛在入口、runtime 或布局适配层，而不是散落在多个页面、composable 与业务组件中

### Requirement: 主应用与子应用都提供显式开发入口
仓库 SHALL 为 `qiankun` 主应用联调和子应用独立调试提供显式、低歧义的脚本入口。主应用入口、联调入口和子应用独立入口 MUST 使用清晰命名，使开发者能够区分“只调子应用”和“联调宿主 + 子应用”两类工作流。

#### Scenario: 开发者可以独立启动子应用
- **WHEN** 开发者只需要调试 `oa-web` 或 `scrm-web` 某个业务页面
- **THEN** 仓库提供显式脚本启动该子应用，而不强制依赖主应用联调

#### Scenario: 开发者可以启动主应用联调整套前端
- **WHEN** 开发者需要验证主应用壳层、菜单跳转和子应用挂载
- **THEN** 仓库提供显式脚本并行启动 `main-web` 与所需子应用，而不是要求开发者手工记忆多个零散命令

### Requirement: 高风险运行配置具备启动期安全基线
仓库 SHALL 为后端运行配置提供启动期安全基线校验。认证密钥、CORS 允许源、Swagger 暴露开关、默认账号策略和生产环境标识 MUST 在应用启动时被校验；缺失、弱配置或开发态默认值进入非本地环境时，系统 MUST 拒绝启动或禁用对应暴露面。

#### Scenario: 非本地环境使用默认密钥
- **WHEN** 后端在非本地环境使用模板默认 `JWT_SECRET` 启动
- **THEN** 系统拒绝启动并输出配置错误

#### Scenario: 非本地环境未显式允许 Swagger
- **WHEN** 后端在非本地环境启动且未显式开启 Swagger
- **THEN** `/docs` 不被注册为公开文档入口

#### Scenario: CORS 使用显式来源列表
- **WHEN** 后端在非本地环境启动
- **THEN** CORS 只允许显式配置的 origin
- **AND** 系统不得使用任意来源反射策略

### Requirement: 安全关键模块必须具备自动化回归测试
仓库 SHALL 为认证、开放集成、上传和租户边界等安全关键模块提供自动化回归测试。任何修改这些模块的 change MUST 至少覆盖成功路径、拒绝路径、审计/限流路径和关键安全边界。

#### Scenario: 修改认证模块
- **WHEN** 开发者修改登录、刷新、JWT 校验或会话撤销逻辑
- **THEN** 对应测试覆盖有效登录、无效登录、限流、弱配置和会话失效场景

#### Scenario: 修改开放集成模块
- **WHEN** 开发者修改连接器登录、Open API 凭证或 Webhook 配置逻辑
- **THEN** 对应测试覆盖伪造请求拒绝、凭证失败限流、租户边界和审计记录

#### Scenario: 修改上传模块
- **WHEN** 开发者修改上传、下载或预览逻辑
- **THEN** 对应测试覆盖文件类型校验、权限拒绝、预览 allowlist 和响应头安全策略

### Requirement: 仓库提供后台展示与安全关键路径质量护栏
仓库 SHALL 为后台展示一致性和安全关键路径提供质量护栏。主应用壳层、微前端嵌入、导航契约、认证、开放集成、上传和租户边界相关变更 MUST 具备自动化测试或明确的手动验证记录，避免只凭主观观察合入。

#### Scenario: 修改主应用或子应用壳层
- **WHEN** 开发者修改 `main-web`、`oa-web` 或 `scrm-web` 的 layout、navigation、router 或 micro runtime
- **THEN** 对应验证覆盖导航可见性、权限兜底、嵌入态布局和移动端菜单

#### Scenario: 修改安全关键后端模块
- **WHEN** 开发者修改 auth、open-integration、uploads 或 tenant-boundary 相关模块
- **THEN** 对应验证覆盖成功路径、拒绝路径、审计路径和边界条件

#### Scenario: 无法自动化的视觉检查被记录
- **WHEN** 某个展示变更暂时无法通过自动化测试覆盖
- **THEN** 开发者记录手动验证页面、断点、账号、浏览器和观察结果

### Requirement: 前端运行入口具备安全响应头基线
仓库 SHALL 为生产或近生产前端运行入口提供安全响应头基线，包括 Content-Security-Policy、X-Content-Type-Options、Referrer-Policy 和必要的 frame/permission 限制。主应用与子应用的配置 MUST 兼容 qiankun 加载方式，并不得依赖 Vite 开发服务器作为生产安全边界。

#### Scenario: 生产容器返回前端资源
- **WHEN** 浏览器请求生产或近生产容器中的前端 HTML
- **THEN** 响应包含配置化 CSP 和基础安全响应头
- **AND** CSP 不阻断已登记的 qiankun 子应用资源加载

#### Scenario: 安全头缺失
- **WHEN** 前端生产镜像或反向代理未配置安全响应头
- **THEN** 近生产验证不得通过

### Requirement: Vite 开发服务器默认只暴露本机
仓库 SHALL 让各前端应用的 Vite 开发服务器默认只监听本机地址。若开发者需要局域网联调，必须通过显式环境变量或脚本启用，并在文档中说明 HMR host、CORS 和安全影响。

#### Scenario: 默认启动前端开发服务器
- **WHEN** 开发者运行默认前端开发命令
- **THEN** Vite 开发服务器只监听本机地址
- **AND** 不默认暴露到局域网所有接口

#### Scenario: 显式启用局域网联调
- **WHEN** 开发者使用明确的局域网联调脚本或环境变量
- **THEN** Vite 可以监听外部接口
- **AND** 文档说明该模式只用于受信任开发网络

### Requirement: 全量 Docker 编排覆盖所有后台前端应用
仓库 SHALL 为主应用和所有后台子应用提供 Dockerfile 或等价构建入口，并在全量 Docker 编排中使用显式服务名引用它们。全量编排 MUST 能表达 `main-web`、`oa-web`、`scrm-web` 与 API 的生产拓扑，不得用单个 `web` 或单个子应用代表全部前端。

#### Scenario: 编排包含全部前端应用
- **WHEN** 开发者查看或启动全量 Docker 编排
- **THEN** 编排中存在 `main-web`、`oa-web` 和 `scrm-web` 的显式服务
- **AND** 每个服务使用对应应用的构建配置

#### Scenario: 新增后台前端应用
- **WHEN** 仓库新增一个生产必需后台前端应用
- **THEN** 全量 Docker 编排和文档必须同步加入该应用的构建与访问入口

