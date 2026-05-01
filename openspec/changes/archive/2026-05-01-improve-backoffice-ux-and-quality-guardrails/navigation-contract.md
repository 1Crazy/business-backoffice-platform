## Navigation Contract

本表锁定主应用导航与子应用路由访问规则的对照关系。短期不抽共享包，原因是三端当前构建边界简单且跨包共享会扩大改动面；本 change 先通过 `apps/main-web/src/router/micro-contract.spec.ts` 让重复配置漂移时直接失败。

### OA

| Host path | Child path | Title | Permission | Hidden | microAppName |
| --- | --- | --- | --- | --- | --- |
| `/oa/workspace` | `/workspace` | 工作台 | `oa:workspace:view` | false | `oa-web` |
| `/oa/approvals/pending` | `/approvals/pending` | 待我审批 | `oa:approval:read` | false | `oa-web` |
| `/oa/administrative-requests/pending` | `/administrative-requests/pending` | 行政审批 | `oa:request:approve` | false | `oa-web` |
| `/oa/approvals/mine` | `/approvals/mine` | 我发起的申请 | `oa:request:apply` | false | `oa-web` |
| `/oa/administrative-requests/mine` | `/administrative-requests/mine` | 我的行政申请 | `oa:request:apply` | false | `oa-web` |
| `/oa/leave/request` | `/leave/request` | 请假申请 | `oa:leave:apply` | false | `oa-web` |
| `/oa/administrative-requests/new` | `/administrative-requests/new` | 行政申请 | `oa:request:apply` | false | `oa-web` |
| `/oa/announcements` | `/announcements` | 公告通知 | `oa:announcement:read` | false | `oa-web` |
| `/oa/directory` | `/directory` | 组织通讯录 | `oa:directory:read` | false | `oa-web` |

### SCRM

| Host path | Child path | Title | Permission | Hidden | microAppName |
| --- | --- | --- | --- | --- | --- |
| `/scrm/dashboard` | `/dashboard` | 运营看板 | `dashboard:view` | false | `scrm-web` |
| `/scrm/customers` | `/customers` | 客户中心 | `customer:read` | false | `scrm-web` |
| `/scrm/opportunities` | `/opportunities` | 商机管理 | `opportunity:read` | false | `scrm-web` |
| `/scrm/leads` | `/leads` | 线索中心 | `lead:read` | false | `scrm-web` |
| `/scrm/system` | `/system` | 系统管理 | `dictionary:read` | false | `scrm-web` |
