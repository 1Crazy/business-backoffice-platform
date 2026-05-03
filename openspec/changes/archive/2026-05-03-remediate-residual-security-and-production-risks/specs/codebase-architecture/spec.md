## MODIFIED Requirements

### Requirement: 前端运行入口具备安全响应头基线
仓库 SHALL 为生产或近生产前端运行入口提供安全响应头基线，包括 Content-Security-Policy、X-Content-Type-Options、Referrer-Policy 和必要的 frame/permission 限制。主应用与子应用的配置 MUST 兼容 qiankun 加载方式，并不得依赖 Vite 开发服务器作为生产安全边界。生产 CSP MUST 尽量移除或隔离 `unsafe-inline` 与 `unsafe-eval`；确因 qiankun 或构建产物需要保留时，MUST 通过环境、路径、nonce/hash、受信任来源或文档化例外缩小范围。

#### Scenario: 生产容器返回前端资源
- **WHEN** 浏览器请求生产或近生产容器中的前端 HTML
- **THEN** 响应包含配置化 CSP 和基础安全响应头
- **AND** CSP 不阻断已登记的 qiankun 子应用资源加载
- **AND** CSP 不默认开放未登记脚本来源

#### Scenario: 安全头缺失
- **WHEN** 前端生产镜像或反向代理未配置安全响应头
- **THEN** 近生产验证不得通过

#### Scenario: CSP 例外被引入
- **WHEN** 配置中新增 `unsafe-inline`、`unsafe-eval` 或新的外部脚本来源
- **THEN** 变更必须说明 qiankun 或运行时约束
- **AND** 自动化或手动 smoke 必须验证没有扩大到非目标环境

### Requirement: 高风险运行配置具备启动期安全基线
仓库 SHALL 为后端运行配置提供启动期安全基线校验。认证密钥、CORS 允许源、Swagger 暴露开关、默认账号策略、生产环境标识、示例环境变量和生产 Docker 端口暴露 MUST 被校验；缺失、弱配置或开发态默认值进入非本地环境时，系统 MUST 拒绝启动、禁用对应暴露面或在文档中要求部署层显式覆盖。数据库端口 MUST NOT 在生产 compose 或生产运行手册中默认映射到宿主机。

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

#### Scenario: 生产 compose 暴露数据库端口
- **WHEN** 近生产或生产 compose 配置 PostgreSQL 服务
- **THEN** 数据库服务默认不向宿主机发布 `5432` 端口
- **AND** 本地开发端口映射必须放在显式开发 override 或文档化脚本中

#### Scenario: 示例环境变量被复制到生产
- **WHEN** 非本地环境使用 `.env.example` 中的占位 secret、默认账号或 mock 开关
- **THEN** 系统拒绝启动或禁用高风险入口

## ADDED Requirements

### Requirement: API 具备版本化演进策略
系统 SHALL 为对外稳定 API 定义版本化策略。新增或 breaking API change MUST 进入明确版本命名空间、兼容层或迁移说明，避免所有接口长期只挂在无版本 `/api/` 前缀下。

#### Scenario: 新增 breaking API
- **WHEN** 团队修改认证、Open API 或核心业务接口的请求/响应契约且不兼容旧调用方
- **THEN** 变更必须提供新版本路径或兼容迁移策略
- **AND** 文档说明旧版本废弃窗口

#### Scenario: 内部管理接口保持当前前缀
- **WHEN** 仅新增后台内部管理接口且不承诺外部稳定契约
- **THEN** 系统可以继续使用现有 `/api` 前缀
- **AND** OpenSpec 需要说明该接口的兼容级别
