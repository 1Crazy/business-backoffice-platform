## Why

`support-multi-frontend-apps` 已经完成，仓库现在具备承载第二个前端应用的工程基础，但真正的 OA 0 到 1 还没有被正式建模。当前系统的账号、权限、菜单、会话存储和后端 seed 仍然都带有明显的 SCRM 单应用假设，例如权限目录没有应用命名空间、前端会话 key 仍然是 `scrm-token` 一类命名、角色权限目录也默认只面向 SCRM 菜单。

如果现在直接“复制一份 `scrm-web` 改成 OA”，很快就会遇到两个问题：

- 前端虽然能跑起来，但账号/权限模型仍然分不清“这个权限属于 SCRM 还是 OA”。
- 后端虽然暂时能复用，但会在没有明确边界的情况下把 OA 需求继续硬塞进当前 SCRM 语义里。

同时，OA 0 到 1 很容易在架构上走偏，要么一开始就过度拆成微服务，要么一上来做通用审批引擎、流程设计器和复杂表单平台。本次 change 需要先把“OA 第一阶段到底做什么、复用什么、不做什么”说清楚，让后续实现以模块化单体和可验证的前端骨架为主，而不是先堆复杂度。

## What Changes

- 新增 `apps/oa-web` 作为第二个后台前端应用，使用独立路由树、布局壳层和 OA 专属视觉语言，而不是把 OA 塞回 `scrm-web`。
- 继续复用当前 `apps/api` 单体后端，在现有账号体系和组织架构上扩展 OA 所需模块，不在本次 change 中拆 `oa-api` 或引入微服务。
- 扩展 `access-control` 能力，使权限目录具备应用命名空间或等效建模，支持同一员工账号在 SCRM 与 OA 两个后台应用中按应用维度授权和渲染菜单。
- 定义 OA MVP 的首批业务范围，聚焦“工作台 + 审批中心 + 请假申请 + 公告通知 + 组织通讯录”，避免一开始就引入通用流程设计器或复杂 BPM 引擎。
- 使用 `ui-ux-pro-max` 约束 OA 的样式系统，采用适合日常办公后台的浅色、结构化、高可扫读视觉方向，而不是直接复用现有 SCRM 视觉或走暗色高装饰方案。

## Capabilities

### New Capabilities

- `office-automation-workspace`: 提供 OA 独立前端工作台、审批中心、请假申请、公告通知和组织通讯录等首批办公协作能力。

### Modified Capabilities

- `access-control`: 将现有单后台产品的权限目录与菜单授权扩展为支持多个后台应用，并允许角色按应用命名空间授予权限。

## Impact

- Affected code:
  - `apps/oa-web`
  - `apps/scrm-web` 中与会话、鉴权、无权限兜底和角色管理相关的共享规则
  - `apps/api/src/modules/**` 中与 OA 模块、认证、角色权限和通讯录复用相关的代码
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/seed.ts`
  - 根级脚本、文档和多前端开发说明
- Affected APIs:
  - 当前认证与当前用户资料接口
  - 角色/权限目录接口
  - OA 工作台、审批中心、请假申请、公告通知与组织通讯录接口
- Dependencies:
  - 现有 `scrm-web` 的鉴权与路由守卫模式
  - 现有 `apps/api` 的 JWT、角色权限与部门/员工基础模块
  - 现有 `Element Plus`, `Vue 3`, `Pinia`, `Vue Router`, `NestJS`, `Prisma`
- Systems:
  - 第二个后台前端应用 `oa-web`
  - 平台级统一账号与多应用权限模型
  - 模块化单体后端中的 OA 业务模块
  - OA 视觉设计系统与页面信息架构
