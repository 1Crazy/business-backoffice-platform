## Why

本次审查还发现一组展示与工程质量问题：主应用和子应用维护多份导航与布局逻辑，微前端样式隔离仍处于退让状态，后台内容区隐藏滚动条影响可发现性，Webhook 测试投递只是字符串模拟，后端高风险模块缺少测试护栏。

这些问题不像认证漏洞那样马上构成入侵入口，但会持续制造交付风险：用户看到的状态可能不真实，宿主菜单与子应用页面可能漂移，页面在不同壳层下容易样式串扰，后续修复也缺少回归保护。该 change 作为第二优先级修复包，聚焦后台使用体验、微前端展示稳定性和工程质量护栏。

## What Changes

- 统一主应用、OA、SCRM 的导航与页面权限契约，减少三套菜单/路由配置的漂移风险。
- 修复微前端展示边界：处理样式隔离、嵌入态布局、加载失败态、滚动条可见性和响应式内容溢出。
- 将 Webhook 测试投递从字符串模拟改为真实可验证的投递结果，或在 UI 上明确标记为模拟并提供真实检测入口。
- 为后端高风险模块建立最小测试基线，尤其是认证、开放集成、上传、权限和租户边界。
- 增加前端展示回归验证，覆盖主应用壳层、OA/SCRM 嵌入态、移动端导航和错误态。

## Capabilities

### New Capabilities

- `backoffice-quality-guardrails`: 后台平台具备跨应用展示一致性、关键链路测试护栏和可验证运行状态。

### Modified Capabilities

- `backoffice-super-app-shell`: 宿主与子应用导航、权限和嵌入态布局必须保持一致。
- `backoffice-visual-language`: 后台页面必须支持可发现滚动、稳定内容尺寸和明确加载/失败状态。
- `open-integration-platform`: Webhook 测试结果必须反映真实投递或清楚区分模拟状态。
- `codebase-architecture`: 高风险模块必须有最小自动化测试与验证命令。

## Impact

- Affected code:
  - `apps/main-web/src/config/navigation.ts`
  - `apps/main-web/src/router/**`
  - `apps/main-web/src/layout/**`
  - `apps/main-web/src/micro/**`
  - `apps/oa-web/src/router/**`
  - `apps/oa-web/src/layout/**`
  - `apps/scrm-web/src/router/**`
  - `apps/scrm-web/src/layout/**`
  - `apps/api/src/modules/open-integration/**`
  - `apps/api/src/modules/auth/**`
  - `apps/api/src/modules/uploads/**`
- Affected validation:
  - frontend unit tests
  - backend Jest tests
  - qiankun host/manual browser checks
  - mobile viewport smoke checks
