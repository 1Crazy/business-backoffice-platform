## Why

当前仓库已经通过 `main-web` 将 OA 与 SCRM 收束到统一入口，但“部门管理 / 员工管理 / 角色权限”仍然以 `scrm-web` 页面形态存在。这会持续向产品和实现同时传递错误信号：一方面组织、员工、角色和授权实际上同时服务 OA 与 SCRM，不应被理解为 SCRM 私有能力；另一方面如果把这类治理页面转而塞进 OA，又会破坏 OA 作为员工日常办公协同入口的产品心智。

团队现在要为长期正确的产品结构做决策，因此需要趁多应用壳层和统一权限模型已经建立的时机，把这类共享治理能力正式提升为平台治理域。这样后续无论继续扩展 OA、SCRM，还是新增第三个后台应用，都能在一致的信息架构下复用组织、员工、角色、会话和审计能力，而不再反复讨论“它到底挂在哪个业务系统下面”。

## What Changes

- 在统一主应用中新增“平台治理”业务域，作为与 OA、SCRM 并列的长期产品域，而不是继续把组织与员工治理挂在 `scrm-web` 下。
- 将当前 `access-control` 的产品归属从“SCRM 页面”提升为“平台级治理能力”，并为部门、员工、角色与权限治理定义中性的页面语义、路由空间和导航位置。
- 为平台治理定义首批信息架构，聚焦组织架构、员工账号、角色授权、应用权限分配及后续可扩展的会话治理与审计入口，而不是把这些能力分散在 OA、SCRM 各自菜单中。
- 调整主应用导航与域分组约定，使 `main-web` 可以稳定承载 `/platform/**` 一类平台治理路由，同时保持 OA 与 SCRM 的业务域心智不被侵蚀。
- 约束迁移策略：短期允许复用现有 `access-control` 实现与后端接口，但中期实现与文档都必须以平台治理语义为准，而不是继续沿用 `scrm` 命名暗示。

## Capabilities

### New Capabilities

- `platform-governance-workspace`: 定义平台治理域的信息架构、路由语义、导航分组和首批组织/员工/角色治理入口。

### Modified Capabilities

- `access-control`: 将部门、员工、角色和应用授权治理从 SCRM 承载页提升为平台级治理能力，并补充其中性路由、页面归属与长期扩展边界。
- `backoffice-super-app-shell`: 扩展统一主应用壳层，使其除了 OA、SCRM 外还能够承载平台治理域，并保持域级导航与上下文清晰可辨。

## Impact

- Affected code:
  - `apps/main-web` 中的导航分组、路由映射、页面标题与域上下文表达
  - 当前承载 `access-control` 的前端页面及其后续迁移承载位置
  - `apps/api/src/modules/departments/**`
  - `apps/api/src/modules/users/**`
  - `apps/api/src/modules/roles/**`
  - 与统一身份、授权目录、会话治理和审计相关的共享模块
- Affected APIs:
  - 部门、员工、角色、权限目录相关接口
  - 后续可能纳入平台治理域的会话治理与审计日志接口
- Dependencies:
  - 现有 `main-web` 多域导航壳层
  - 现有 `access-control` 统一身份与权限模型
  - `oa-web` 与 `scrm-web` 已经建立的应用命名空间授权体系
- Systems:
  - 统一前端主应用 `main-web`
  - 平台治理域信息架构
  - 统一组织、员工、角色与权限治理能力
