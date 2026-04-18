## ADDED Requirements

### Requirement: 宿主与子应用在鉴权失效时回到统一登录入口
系统 SHALL 在 `qiankun` 宿主模式下把 OA 与 SCRM 子应用的登录失效跳转统一收口到主应用登录入口。子应用在宿主模式下 MUST NOT 把用户导向自身 base 下的独立登录路由。

#### Scenario: OA 子应用会话失效时跳回宿主登录页
- **WHEN** `oa-web` 在宿主模式下因为 token 缺失或 profile 拉取失败触发重新登录
- **THEN** 系统将用户导向主应用的 `/login`，而不是 `/oa/login`

#### Scenario: SCRM 子应用会话失效时跳回宿主登录页
- **WHEN** `scrm-web` 在宿主模式下因为 token 缺失或 profile 拉取失败触发重新登录
- **THEN** 系统将用户导向主应用的 `/login`，而不是 `/scrm/login`
