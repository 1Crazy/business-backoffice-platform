## Why

当产品完成单企业落地和可配置治理之后，下一步瓶颈会变成“如何把一套系统稳定复制给多家企业”。当前系统的组织、用户、客户和业务数据模型仍然更偏单企业内部使用，缺少租户隔离、租户配置、开放集成和产品运营能力。需要为平台化和 SaaS 化建立正式基础。

## What Changes

- 引入多租户隔离模型，把身份、组织、权限、业务数据、审计和配置全部纳入租户边界。
- 增加租户运营与开通能力，支持租户创建、初始化、停用、配额和运营视角管理。
- 增加产品配置中心，支持租户级菜单、字段、表单、主题、模板和行业配置。
- 增加开放平台能力，支持 Open API、Webhook、SSO/LDAP/OAuth 企业接入和外部系统集成。

## Capabilities

### New Capabilities
- `tenant-isolation-foundation`: 覆盖租户模型、租户级身份与数据隔离、租户初始化和租户审计能力。
- `tenant-operations-console`: 覆盖租户开通、停用、配额管理、运行状态与平台运营视图能力。
- `product-configuration-center`: 覆盖租户级菜单、字段、表单、主题和模板配置能力。
- `open-integration-platform`: 覆盖 Open API、Webhook、SSO/LDAP/OAuth 和第三方系统集成能力。

### Modified Capabilities
- `access-control`: 让账号、角色、权限和会话治理全部具备租户边界与租户级授权语义。
- `platform-governance-workspace`: 让平台治理能力支持租户级组织、员工和角色治理，而不是默认单企业全局治理。
- `system-administration`: 让系统管理支持租户配置、租户审计、开放接口和平台级运维治理。

## Impact

- `apps/main-web`
- `apps/api`
- 几乎所有核心 Prisma 模型与关联关系
- 认证、授权、审计、组织治理和系统管理模块
- 新增租户中心、平台运营后台和开放平台模块
- 平台级配置中心、模板中心和品牌主题能力
- 外部身份源、第三方消息/ERP/财务等集成接口
- 部署、迁移、种子、运维和数据隔离策略
- `openspec/specs/access-control/spec.md`
- `openspec/specs/platform-governance-workspace/spec.md`
- `openspec/specs/system-administration/spec.md`
