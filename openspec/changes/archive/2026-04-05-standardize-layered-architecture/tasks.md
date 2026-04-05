## 1. Architecture Guardrails And Conventions

- [x] 1.1 更新仓库开发文档，明确前端 `pages/api/types/composables/components` 与后端 `controller/service/repository/dto/vo` 的职责边界、命名约定和企业级可维护性 checklist。
- [x] 1.2 新增仓库级 `architecture:check` 校验，覆盖 Vue 文件行数阈值、展示层越层请求、controller 越层 ORM 访问和 Prisma 使用位置限制。
- [x] 1.3 将架构校验接入现有 `lint`/CI 流程，并为暂时无法静态检查的复杂度规则补充评审说明。

## 2. Frontend Shared Layer Extraction

- [x] 2.1 按业务域拆分 `apps/web/src/types/entities.ts`，补齐请求类型、响应类型和页面表单类型，停止继续向单一大文件追加类型定义。
- [x] 2.2 为 `auth`、`customers`、`leads`、`access-control`、`system-administration` 和 `uploads` 建立领域 `api` 模块，并把页面/组件里的直接 `http` 调用迁移出去。
- [x] 2.3 为列表筛选、弹窗表单、跟进抽屉和上传流程提取领域 composables 与 payload mapper，统一请求编排和错误反馈策略。

## 3. Frontend Heavy Page Refactors

- [x] 3.1 重构 `CustomersPage.vue` 为 page shell + sections/dialogs/drawer + composables，并将 `RecordUploadPanel.vue` 改造成不直接请求接口的展示/交互组件。
- [x] 3.2 重构 `LeadsPage.vue` 及其提醒、转客户、跟进流程，消除页面内聚合的请求、数据转换和 UI 提示逻辑。
- [x] 3.3 重构 `AccessControlPage.vue`，将部门、员工、角色三个子域拆成独立 section/component/composable 组合。
- [x] 3.4 重构 `SystemAdminPage.vue`、`DashboardPage.vue`、`LoginPage.vue` 和 `AppLayout.vue`，确保文件长度、模板表达式和提交方法职责满足规范。

## 4. Backend Repository And Response Contract Foundation

- [x] 4.1 为 `auth`、`customers`、`leads` 和 `uploads` 模块新增 repository、VO/Response DTO 与 mapper，并定义统一的返回契约。
- [x] 4.2 将上述模块中的 Prisma 查询、事务和关联装载迁移到 repository，收敛 service 为业务编排层。
- [x] 4.3 为 `users`、`roles`、`departments`、`dictionaries`、`audit-logs` 和 `dashboard` 模块补齐相同的 repository 与 response contract 结构。

## 5. Backend Controller And Module Hardening

- [x] 5.1 更新各模块 controller，使其仅负责路由、参数接收和 service 调用，并移除剩余的响应整形或 ORM 相关逻辑。
- [x] 5.2 统一各模块的 export/import wiring，确保跨模块依赖通过 module 导出的 service 契约访问，而不是直接引用内部实现。
- [x] 5.3 同步更新 Swagger 响应注解、共享类型和接口断言，使实际返回对象与 VO/Response DTO 契约保持一致。

## 6. Verification And Rollout

- [x] 6.1 为前端 composables、页面 section 组件和关键业务流补充或更新测试，覆盖列表加载、表单提交、跟进抽屉和登录跳转等核心场景。
- [x] 6.2 为后端 repository、service、controller 和 response mapping 补充或更新测试，覆盖关键查询、事务、权限和返回契约场景。
- [x] 6.3 完成一次仓库级验证，执行 `pnpm lint`、`pnpm test`、`pnpm build` 与 `architecture:check`，并记录仍需后续分批治理的遗留例外。
