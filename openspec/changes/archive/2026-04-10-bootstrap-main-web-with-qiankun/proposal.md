## Why

当前仓库已经同时具备 `oa-web` 与 `scrm-web` 两个独立前端应用，但它们仍然以“并排存在”的方式被使用：员工需要先判断自己要进入哪个系统、再分别登录或收藏不同入口，跨域切换时也会丢失统一的导航上下文。随着 OA 与 SCRM 能力继续增长，这种“双应用平铺”的进入方式会让平台越来越像两个孤岛，而不是一个统一的业务后台工作台。

用户已经明确希望新增一个前端主应用，并使用 `qiankun` 将 OA 与 SCRM 的菜单内容页整合到同一个壳层里。同时，本次实现不能只追求“能集成”，还需要把可维护性放在首位，让主应用、子应用、导航、鉴权、样式和运行模式之间的边界足够清晰，后续新增第三个后台应用时也能沿用同一套接入方式。

## What Changes

- 新增 `apps/main-web` 作为统一前端主应用，负责登录入口、全局导航、统一视觉壳层、权限兜底和 `qiankun` 子应用注册。
- 采用 `qiankun` 将现有 `apps/oa-web` 与 `apps/scrm-web` 接入主应用，使用户可以在一个统一菜单中访问 OA 与 SCRM 的内容页，而不是在两个独立入口间跳转。
- 保持 `oa-web` 与 `scrm-web` 继续支持独立运行；当它们被主应用承载时，只渲染业务内容并隐藏重复的导航壳层，从而避免双侧边栏、双顶栏和双登录入口并存。
- 使用 `ui-ux-pro-max` 为主应用定义集团级门户视觉系统，采用适度收敛的玻璃质感、稳定的信息密度、清晰的域分组导航和统一的页面标题节奏。
- 更新根脚本、开发说明和前端接入约定，使本地主应用联调、独立子应用调试与未来新子应用接入都有明确入口。

## Capabilities

### New Capabilities

- `backoffice-super-app-shell`: 提供基于 `qiankun` 的统一前端主应用壳层，负责登录、菜单、导航、子应用容器、跨域权限兜底与 OA/SCRM 页面整合。

### Modified Capabilities

- `codebase-architecture`: 补充 `qiankun` 主应用与子应用的工程边界、目录约定、运行模式和开发脚本规则。
- `backoffice-visual-language`: 为主应用门户补充集团级视觉规则，使主应用在承载多个后台子域时仍然保持统一、稳定、可扫读的体验。

## Impact

- Affected code:
  - `apps/main-web`
  - `apps/oa-web` 中的入口、路由、布局与微前端运行模式适配
  - `apps/scrm-web` 中的入口、路由、布局与微前端运行模式适配
  - 根级 `package.json`、`pnpm-lock.yaml`、开发文档与环境说明
- Affected APIs:
  - 继续复用当前统一登录、当前用户资料与权限接口，不新增主应用专属后端接口
- Dependencies:
  - `qiankun`
  - 适配 Vite 子应用接入所需的 qiankun 辅助依赖
  - 当前 `Vue 3`、`Vue Router`、`Pinia`、`Element Plus`
- Systems:
  - 新增主应用 `main-web`
  - 现有子应用 `oa-web` / `scrm-web`
  - 本地多前端联调脚本与开发工作流
