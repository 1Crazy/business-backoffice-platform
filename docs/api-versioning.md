# API 版本化与契约分级

本文档定义当前仓库 API 的兼容级别、版本化规则和 breaking change 处理方式。

## 目标

- 明确哪些接口属于内部管理接口，允许随仓库同版本发布一起演进。
- 明确哪些接口已经对外形成稳定契约，后续 breaking change 不能继续直接挂在无版本 `/api` 前缀下。
- 给 Webhook、健康检查、指标和 Open API 这类非页面接口一套清晰的兼容边界。

## 契约分级

### 1. 内部管理接口

适用范围：

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/profile`
- `GET|POST|PATCH /api/auth/sessions/**`
- `GET|POST|PATCH /api/customers/**`
- `GET|POST|PATCH /api/leads/**`
- `GET|POST|PATCH /api/sales-opportunities/**`
- `GET|POST|PATCH /api/revenue-operations/**`
- `GET|POST|PATCH /api/oa/**`
- `GET|POST|PATCH /api/workflows/**`
- `GET|POST|PATCH /api/system-governance/**`
- `GET|POST|PATCH /api/users|roles|departments|dictionaries|product-configuration|tenant-operations|notification-center|workfeed|batch-tasks|uploads/**`

规则：

- 这些接口当前仍使用统一 `/api/**` 前缀。
- 它们被视为“仓库内联动发布”的内部契约，允许在同一仓库前后端同步升级时演进。
- 对内部前端造成破坏的变更，必须同时提交前端适配、OpenSpec 变更说明和迁移说明。
- 内部接口若被计划对第三方或跨仓库客户端长期开放，必须先升级为“外部稳定契约”。

### 2. 外部稳定契约

适用范围：

- `GET /api/open-api/customers`
- `GET /api/open-api/customers/:id`
- Webhook 订阅回调 payload、签名头和投递语义

当前约定：

- 当前 `open-api` 路径虽然还没有显式 `/v1`，但语义上已经按“稳定 v1 契约”对待。
- 当前 Webhook 事件 `APPROVAL_COMPLETED`、`REVENUE_PAYMENT_RECEIVED`、`WORKFLOW_INSTANCE_COMPLETED`、`GOVERNANCE_ALERT` 的 payload 也按稳定对外契约对待。

规则：

- 对外稳定契约的 breaking change 不得继续直接修改现有无版本路径。
- 下一次 breaking change 必须采用以下至少一种方式：
  - 新增 `/api/open-api/v2/**`
  - 保留旧 payload 并增加版本字段 / 兼容层
  - 为 Webhook 事件增加显式 schema version，并保留旧版本废弃窗口
- 变更文档必须说明：
  - 旧版本支持窗口
  - 废弃时间
  - 客户端迁移步骤

### 3. 运维与平台信号

适用范围：

- `GET /api/health`
- `GET /api/metrics`
- `GET /docs`

规则：

- 这些入口不是业务 API 版本面，但属于运维契约。
- 字段扩展允许向后兼容追加，删除或改名视为 breaking change。
- 非本地环境 Swagger 必须受访问控制保护，不能作为公开稳定 API 目录。

## 版本化规则

### 内部接口

- 允许继续使用 `/api/**`。
- breaking change 必须和同仓库前端一起发布。
- OpenSpec 需要标注“内部接口”并给出联动改动范围。

### 外部稳定接口

- 当前无版本路径按“逻辑 v1”管理。
- 下一次 breaking change 开始，必须引入显式版本策略，不能继续原地修改。
- 新增字段、放宽校验、追加事件字段属于兼容变更，可以继续在现有路径追加。

### Webhook

- Webhook payload 视为外部稳定契约。
- 新增字段默认允许，删除字段、重命名字段、修改签名规则、修改事件名属于 breaking change。
- breaking change 必须通过事件版本或新订阅版本处理，不能静默替换现有 payload。

## 当前接口分级表

| 接口族 | 当前级别 | 版本策略 |
| --- | --- | --- |
| `/api/auth/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/customers/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/leads/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/sales-opportunities/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/revenue-operations/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/oa/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/workflows/**` | 内部管理接口 | 继续 `/api`，随前后端联动发布 |
| `/api/open-integration/**` | 内部治理接口 | 继续 `/api`，仅租户管理员/平台治理使用 |
| `/api/open-api/**` | 外部稳定契约 | 当前按逻辑 `v1` 管理，breaking change 必须显式版本化 |
| Webhook payload / signature | 外部稳定契约 | 当前按逻辑 `v1` 管理，breaking change 必须显式版本化 |
| `/api/health` | 运维契约 | 兼容追加字段，避免删改现有字段 |
| `/api/metrics` | 运维契约 | Prometheus 指标名变更视为 breaking change |
| `/docs` | 受控文档入口 | 不视为外部稳定 API 目录 |

## 变更门禁

以下情况必须在 OpenSpec 中明确写出版本策略：

- 修改 `open-api` 请求/响应结构且旧调用方不能继续工作。
- 修改 Webhook 事件名、签名规则或移除字段。
- 修改 `/api/health` 或 `/api/metrics` 已被运维系统依赖的字段/指标名。

以下情况可以继续按兼容变更处理：

- 在 JSON 响应中追加新字段。
- 放宽枚举、校验或筛选条件。
- 新增内部接口族下的新路由，且不承诺第三方长期集成。
