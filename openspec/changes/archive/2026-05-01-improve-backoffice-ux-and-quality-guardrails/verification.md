## Verification

### Automated

- `pnpm --filter platform-api lint`：通过。
- `pnpm --filter platform-api test`：34 suites / 120 tests 通过。
- `pnpm --filter main-web lint`：通过。
- `pnpm --filter main-web test`：8 files / 19 tests 通过，覆盖导航契约、移动/侧边导航、微前端错误态。
- `pnpm --filter oa-web lint`：通过。
- `pnpm --filter oa-web test`：9 files / 12 tests 通过，覆盖登录无可访问 OA 路由时跳转 `/no-access`。
- `pnpm --filter scrm-web lint`：通过。
- `pnpm --filter scrm-web test`：13 files / 29 tests 通过，覆盖系统管理 Webhook 展示 fixture、SCRM 登录和无权限兜底。
- `python3 /Users/hong/.codex/skills/webapp-testing/scripts/with_server.py --server "pnpm --filter main-web dev" --port 5175 --server "pnpm --filter oa-web dev" --port 5174 --server "pnpm --filter scrm-web dev" --port 5173 --timeout 60 -- node openspec/changes/improve-backoffice-ux-and-quality-guardrails/visual-smoke.mjs`：8/8 场景通过，报告写入 `/tmp/backoffice-visual-smoke/report.json`。
- `pnpm -r lint`：通过。
- `pnpm -r test`：通过。
- `openspec validate improve-backoffice-ux-and-quality-guardrails`：通过。
- `openspec validate harden-auth-and-open-integration`：通过。

### Visual Checklist

本轮已使用 Playwright 启动 `main-web`、`oa-web`、`scrm-web` 开发服务完成最小视觉烟雾验证，所有场景均满足 expected text 命中、无控制台错误、无横向溢出。截图写入 `/tmp/backoffice-visual-smoke/*.png`：

- Desktop host workfeed：`http://localhost:5175/workfeed`，1440x960，通过。
- Desktop host embedded OA：`http://localhost:5175/oa/workspace`，1440x960，通过，`#micro-app-slot` 有内容。
- Desktop host embedded SCRM：`http://localhost:5175/scrm/system`，1440x960，通过，`#micro-app-slot` 有内容。
- Desktop standalone OA：`http://localhost:5174/workspace`，1440x960，通过。
- Desktop standalone SCRM：`http://localhost:5173/dashboard`，1440x960，通过。
- Mobile host workfeed：`http://localhost:5175/workfeed`，390x844，通过。
- Mobile host embedded OA：`http://localhost:5175/oa/workspace`，390x844，通过，`#micro-app-slot` 有内容。
- Mobile host embedded SCRM：`http://localhost:5175/scrm/system`，390x844，通过，`#micro-app-slot` 有内容。

### Notes

- Webhook 真实投递使用 Node 20 原生 `fetch`、`AbortController`、`dns.lookup` 和 `net.isIP`，未新增 npm 包。
- Webhook 投递模式与耗时存入现有 `WebhookDelivery.payload` JSON，避免新增数据库迁移；API 响应映射为 `deliveryMode` 和 `durationMs`。
- 视觉烟雾期间补齐了运行时配置、OA/SCRM 启动数据和开放平台资源 mock；前端也对 workfeed、OA workspace、身份连接器响应做了数组归一化，避免脏响应导致页面白屏。
