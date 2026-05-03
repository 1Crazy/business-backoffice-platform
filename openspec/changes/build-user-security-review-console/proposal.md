## 背景

上一轮安全加固已经在后端完成了账号安全锁定状态模型：`NONE`、`REVIEW_REQUIRED`、`LOCKED`。当用户连续失败登录接近阈值时，系统会把账号标记为待管理员审核；达到阈值后，系统会进入永久锁定状态，管理员可以通过解锁接口解除。

目前这套能力主要停留在后端和 API 层：

- 用户列表返回 `lockedAt`、`securityLockStatus`、`securityLockReason`、`securityLockReviewedAt`
- 管理员已有 `PATCH /api/users/:id/unlock`
- 登录与会话校验已经会拒绝 `REVIEW_REQUIRED` / `LOCKED` 状态

但前端还缺少一套明确的“安全审核工作台”入口和操作流。管理员虽然理论上可以通过通用用户列表或直接调用接口处理问题账号，但没有集中视图、状态筛选、原因展示和审核运营动作，无法形成成熟的日常治理能力。

## 变更内容

- 在平台治理域新增“账号安全审核”工作台，用于查看 `REVIEW_REQUIRED` 和 `LOCKED` 的账号。
- 在工作台中明确展示：
  - 锁定状态
  - 锁定原因
  - 锁定时间
  - 最近审核时间
  - 用户基本身份信息与角色
- 为授权管理员提供“解除锁定 / 通过审核”操作，复用现有解锁接口或补充必要的展示契约。
- 在主应用宿主和平台治理原生页中增加入口，不要求管理员进入 OA / SCRM 子应用后再处理安全审核。
- 补齐前端测试和必要的后端展示映射测试，确保安全锁定状态在页面和 API 契约中一致。

## 能力范围

### 修改能力

- `access-control`: 补齐管理员安全审核工作台前端、账号锁定状态展示与审核解锁操作流。
- `platform-governance-workspace`: 在平台治理域增加账号安全审核入口与原生工作台。

## 影响范围

- 影响代码：
  - `apps/main-web/src/pages/platform-governance/**`
  - `apps/main-web/src/router/**`
  - `apps/main-web/src/config/navigation/**`
  - `apps/api/src/modules/users/**`
  - `apps/api/src/common/mappers/access-control.mapper.ts`
  - `apps/api/src/common/vo/access-control.vo.ts`
  - `apps/api/test/users.service.spec.ts`
  - `apps/main-web/src/**.spec.ts`
- 影响接口：
  - `GET /api/users`
  - `PATCH /api/users/:id/unlock`

## 约束

- 本次 change 只做“管理员安全审核工作台”，不再扩展新的安全策略或新的锁定规则。
- 不新建独立子应用；工作台应优先落在现有 `main-web` 平台治理原生页内。
- 解锁动作必须继续受 `user:write` 权限保护，并保留后端审计。
