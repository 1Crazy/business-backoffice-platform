## ADDED Requirements

### Requirement: 后端源文件使用根别名导入
对于新建或被大幅修改的后端源文件，`apps/api/src` 内部的跨目录依赖 SHALL 使用 `@/` 作为 `src` 根别名，而不是继续使用两层及以上的相对路径回退。`./` 与单层 `../` 在局部近邻引用场景中 MAY 保留，但出现多层回退时 MUST 收敛到根别名。

#### Scenario: 后端 service 引用共享能力时使用根别名
- **WHEN** service、controller、repository、mapper 或 vo 需要引用 `apps/api/src/common` 或其他业务模块中的文件
- **THEN** 两层及以上目录回退的导入被替换为 `@/` 开头的根别名，而不是 `../../` 或 `../../../` 形式

#### Scenario: 后端工具链支持根别名
- **WHEN** 开发者运行后端开发服务器、测试、seed 脚本或构建后的产物
- **THEN** 这些运行入口都能够正确解析 `@/` 根别名，而不会因 alias 丢失导致启动失败

### Requirement: 前后端复杂逻辑与接口契约提供中文说明
对于新建或被大幅修改的前后端核心业务文件，复杂业务规则、边界条件、兼容处理、空值归一化和非常规实现 SHALL 提供有维护价值的中文注释，说明文件职责和关键决策原因。Swagger controller、DTO 和 VO/Response DTO SHALL 提供中文摘要或字段说明，帮助接口使用者理解业务语义，而不是只暴露类型结构。

#### Scenario: 复杂业务分支补充中文维护注释
- **WHEN** service、composable、store、api 层或共享基础设施中存在非直观规则、兼容逻辑或副作用流程
- **THEN** 实现包含准确的中文职责说明或关键分支注释，解释为什么需要这些处理

#### Scenario: Swagger 契约提供中文语义说明
- **WHEN** controller 暴露接口或 DTO、VO 定义输入输出字段
- **THEN** Swagger 文档包含中文 `summary`、`description` 或字段说明，使接口读者无需回到源码猜测字段用途和限制

## MODIFIED Requirements

### Requirement: 仓库在合并前校验关键架构边界
仓库 SHALL 提供可在本地和 CI 中运行的架构校验机制，用于在代码合并前发现关键结构违规。该校验至少 MUST 覆盖前端文件行数阈值、展示层越层请求、controller 越层 ORM 访问、Prisma 使用位置限制以及后端多层相对导入回退；对于暂时无法静态检查的复杂度规则、中文注释质量与 Swagger 说明完整度，仓库 SHALL 提供明确的 review checklist。该机制 MUST 以企业级可维护性为目标，覆盖稳定命名、职责单一、低耦合、可测试性和文档可读性等基础要求。

#### Scenario: 违规导入在校验中被阻止
- **WHEN** 展示组件或页面直接导入底层 HTTP 客户端、controller 直接使用 Prisma，或者后端源文件新增两层及以上的相对路径回退导入
- **THEN** 架构校验在本地或 CI 中标记失败，阻止该变更无提示地进入主干

#### Scenario: 人工 review 覆盖静态脚本难以判断的规则
- **WHEN** 一个改动涉及模板复杂表达式、方法职责边界、中文注释质量或 Swagger 说明完整度
- **THEN** 开发者和评审者依据仓库内的架构 checklist 逐项确认这些规则已经满足

#### Scenario: 新代码以可维护性标准进入主干
- **WHEN** 团队新增或重构一个业务模块
- **THEN** 该模块在命名、分层、契约、注释和测试入口上满足仓库定义的企业级可维护性标准，而不是仅仅“功能可用”
