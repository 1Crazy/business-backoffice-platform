## ADDED Requirements

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
