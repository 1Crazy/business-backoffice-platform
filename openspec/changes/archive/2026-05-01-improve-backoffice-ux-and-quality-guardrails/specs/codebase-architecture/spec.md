## ADDED Requirements

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
