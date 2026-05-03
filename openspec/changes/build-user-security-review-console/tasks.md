## 1. 回归与契约

- [ ] 1.1 补充 `main-web` 平台治理测试，覆盖安全审核视图渲染、状态筛选和解锁动作。
- [ ] 1.2 补充 API / mapper 测试，确认 `UserVo` 暴露 `securityLockStatus`、`securityLockReason`、`securityLockReviewedAt`。

## 2. 后端展示补缝

- [ ] 2.1 确认用户列表返回的安全锁定字段契约稳定，必要时补充展示字段或排序支持。
- [ ] 2.2 确认 `PATCH /api/users/:id/unlock` 在 `REVIEW_REQUIRED` 与 `LOCKED` 两种状态下都可恢复为 `NONE`。

## 3. 前端工作台

- [ ] 3.1 在 `main-web` 平台治理原生页中新增“账号安全审核”视图或 tab。
- [ ] 3.2 实现安全审核筛选、摘要统计和被锁定账号列表。
- [ ] 3.3 实现详情抽屉和解锁确认操作流。
- [ ] 3.4 为无 `user:write` 权限场景增加只读态处理。

## 4. 验证

- [ ] 4.1 运行 `pnpm --filter main-web lint` 和 `pnpm --filter main-web test`。
- [ ] 4.2 运行 `pnpm --filter platform-api lint` 和 `pnpm --filter platform-api test`。
