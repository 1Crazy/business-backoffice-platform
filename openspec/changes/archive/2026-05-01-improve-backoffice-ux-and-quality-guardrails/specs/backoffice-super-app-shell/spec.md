## MODIFIED Requirements

### Requirement: 主应用通过 qiankun 承载 OA 与 SCRM 内容页
主应用 SHALL 使用 `qiankun` 承载 `oa-web` 与 `scrm-web` 子应用，并根据当前路由前缀激活相应子应用。OA 页面 MUST 挂载在 `/oa/**` 路径空间下，SCRM 页面 MUST 挂载在 `/scrm/**` 路径空间下。主应用 MUST 在子应用加载失败时展示可诊断错误态，包括子应用名称、入口地址、错误摘要和重试入口。

#### Scenario: 主应用进入 OA 页面时激活 OA 子应用
- **WHEN** 用户在主应用中访问 `/oa/workspace` 或其他 `/oa/**` 页面
- **THEN** 系统加载并激活 `oa-web` 子应用，在主应用内容区渲染对应 OA 页面

#### Scenario: 主应用进入 SCRM 页面时激活 SCRM 子应用
- **WHEN** 用户在主应用中访问 `/scrm/dashboard` 或其他 `/scrm/**` 页面
- **THEN** 系统加载并激活 `scrm-web` 子应用，在主应用内容区渲染对应 SCRM 页面

#### Scenario: 子应用加载失败时展示诊断信息
- **WHEN** 主应用加载某个子应用失败
- **THEN** 错误态展示子应用名称、entry 地址和错误摘要
- **AND** 用户可以触发重试或返回首个可访问页面
