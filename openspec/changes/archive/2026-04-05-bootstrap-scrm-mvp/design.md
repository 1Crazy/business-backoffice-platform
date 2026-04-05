## Context

当前仓库只有 OpenSpec 基础配置，没有前后端工程、数据库结构或部署约定。本次变更目标是启动一套单租户 SCRM MVP，优先支撑“账号与权限 -> 客户 -> 线索 -> 跟进 -> 基础看板”的业务闭环，同时保留后续接入企业微信、自动化营销和更多统计分析的演进空间。

约束与前提如下：

- 一期范围采用单租户内部使用模式，不做 SaaS 隔离设计。
- 前端使用 `Vue 3 + TypeScript`，优先选择成熟后台管理组件方案，以保证交付效率。
- 后端使用 `NestJS`，数据库使用 `PostgreSQL`，本地开发数据库通过 Docker 启动。
- 一期以单体应用为主，避免在需求尚未稳定时引入微服务与复杂中间件。

## Goals / Non-Goals

**Goals:**

- 建立一套可直接进入实现阶段的前后端工程骨架和数据库基础设施。
- 通过模块化单体架构覆盖 MVP 所需的基础能力与业务流程。
- 让核心能力的边界清晰：权限、客户、线索跟进、看板、系统管理各自独立，可分阶段实施。
- 保证本地开发、接口调试、数据库迁移和 API 文档具备一致体验。

**Non-Goals:**

- 不在一期实现企业微信、公众号、短信、邮件等外部渠道集成。
- 不在一期实现自动化营销、复杂审批流、会话归档、外呼系统等高级 SCRM 场景。
- 不在一期实现多租户隔离、计费或插件市场能力。
- 不引入 Redis、消息队列或对象存储作为一期必需前置条件。

## Decisions

### 1. 采用前后端分离的单仓库结构

Decision:
采用单仓库组织形式，至少包含 `apps/web` 与 `apps/api` 两个应用，以及根级共享开发配置。

Rationale:

- 当前项目从零启动，单仓库更利于统一依赖管理、脚本、代码规范与文档。
- 前后端接口联调和数据库迁移会非常频繁，单仓库协作成本更低。
- 后续如果需要补充共享类型定义、接口约定或脚本，也更容易管理。

Alternatives considered:

- 多仓库拆分：隔离更强，但在 MVP 阶段会增加脚手架、CI 和联调成本。
- Monorepo + 复杂构建编排工具：可扩展性更强，但一期不是必要复杂度。

### 2. 前端采用 Vue 3 + TypeScript + Vite + Pinia + Vue Router + Element Plus

Decision:
前端采用 Vue 3 技术栈，使用 Pinia 管理状态，使用 Element Plus 构建后台界面。

Rationale:

- 这套组合成熟稳定，适合传统后台管理系统快速交付。
- Vue 3 与 TypeScript 的组合能兼顾开发效率和类型安全。
- Element Plus 对表格、表单、抽屉、树结构等后台场景支持完整，能降低 MVP 设计和开发成本。

Alternatives considered:

- 自定义 UI 或更激进的设计体系：视觉可塑性更强，但不利于快速起步。
- Naive UI / Ant Design Vue：也可行，但相对而言团队更容易在 Element Plus 上快速搭建企业后台。

### 3. 后端采用 NestJS 模块化单体 + Prisma + PostgreSQL

Decision:
后端采用 NestJS 作为 API 框架，按领域模块拆分；ORM 选择 Prisma；数据库选择 PostgreSQL。

Rationale:

- NestJS 适合从零构建有清晰模块边界的企业后台服务，并自带守卫、拦截器和依赖注入体系。
- Prisma 在 schema 管理、迁移、类型生成与查询体验上更适合 TypeScript 项目。
- PostgreSQL 在结构化业务数据、事务和索引能力方面足够支撑一阶段 CRM 数据模型。

Alternatives considered:

- TypeORM：生态成熟，但在类型体验和迁移可维护性上不如 Prisma。
- MySQL：同样可用，但本次默认采用 PostgreSQL 以支持更灵活的数据约束和查询演进。

### 4. 认证方案采用账号密码登录 + JWT + RBAC

Decision:
一期采用后台账号密码登录，服务端签发 JWT，基于角色进行菜单与接口权限控制。

Rationale:

- 账号密码 + JWT 是 MVP 阶段最直接、可验证的方案。
- RBAC 能覆盖管理员、销售主管、销售成员等常见后台角色模型。
- 菜单权限与接口权限分层，有助于前端展示控制与后端安全控制保持一致。

Alternatives considered:

- Session/Cookie：对后台也可行，但在前后端分离与 Swagger 调试场景下略不如 JWT 直接。
- ABAC：灵活性更高，但一期实现成本与规则管理成本偏高。

### 5. 核心领域模型围绕客户生命周期组织

Decision:
一期核心模型包括 `User`、`Role`、`Department`、`Customer`、`CustomerTag`、`Lead`、`FollowUp`、`TodoReminder`、`AuditLog`、`DictionaryEntry` 和 `Attachment`。

Rationale:

- 这些模型可以覆盖“线索录入 -> 归属分配 -> 客户转化 -> 持续跟进 -> 运营观察”的最小闭环。
- 保留标签、来源、状态等可配置字段，方便后续按行业场景微调。
- 将审计、字典与附件作为基础支撑模型，可以减少后续返工。

Alternatives considered:

- 更细粒度拆出活动、商机、合同等模型：更完整，但超出 MVP 范围。
- 把提醒直接塞入跟进记录：实现更简单，但后续待办管理和提醒状态扩展会受限。

### 6. 本地开发数据库通过 Docker Compose 管理

Decision:
在仓库根目录使用 `docker-compose` 启动 PostgreSQL，并为后端应用提供标准连接配置。

Rationale:

- 用户已明确要求在 Docker 中启用数据库。
- 统一数据库版本和初始化方式可以减少团队环境差异。
- 后续新增 pgAdmin、备份脚本或测试库时也容易扩展。

Alternatives considered:

- 本机直装 PostgreSQL：启动简单，但环境差异和版本偏差更难控制。
- 使用托管数据库作为开发环境：不适合作为本地 MVP 起步方案。

## Risks / Trade-offs

- [Risk] 一期 capability 数量偏多，容易在实现阶段出现范围膨胀 -> Mitigation: 严格按 MVP 执行，只交付列表、详情、编辑、转换、统计等核心路径。
- [Risk] RBAC 设计过细会拖慢交付 -> Mitigation: 一期先提供角色、菜单、接口三级基础授权，不引入复杂策略引擎。
- [Risk] 线索转客户会带来状态同步和数据去重问题 -> Mitigation: 在转换流程中明确“一次性转换”和“原线索保留只读状态”的规则。
- [Risk] 看板指标定义若不统一，前后端会出现口径偏差 -> Mitigation: 在接口层固定统计口径与时间范围参数，并在 specs 中定义可测试行为。
- [Risk] 从空仓库同时搭建前后端与数据库，初始化工作量较大 -> Mitigation: 先完成工程脚手架、环境配置和基础模块，再逐步实现业务模块。

## Migration Plan

- 第一步建立仓库结构、包管理与基础脚本。
- 第二步创建 Docker 化 PostgreSQL、本地环境变量模板与 Prisma schema。
- 第三步实现认证、权限、组织与用户管理，为其余业务模块提供基础依赖。
- 第四步实现客户、线索、跟进与系统管理模块。
- 第五步补齐看板、接口文档、基础测试与初始化数据。
- 本次变更为全新系统启动，不涉及存量数据迁移；回滚策略以停止新服务、回退数据库迁移和恢复上一版本代码为主。

## Open Questions

- 一期默认的角色集合是否固定为“超级管理员 / 销售主管 / 销售成员”，还是需要额外预置运营角色。
- 跟进提醒是否只做站内待办，还是需要预留短信/邮件提醒扩展字段。
- 客户去重规则是否仅基于手机号，还是需要同时考虑企业名称和联系人组合。
