## Context

当前仓库已经形成一套比较清晰的前端 `@/` 根别名用法，但后端 `apps/api/src` 仍然大量使用 `../../` 这类多层相对路径。与此同时，仓库文档已经要求关键逻辑必须补充中文注释、Swagger 需要和显式契约协同维护，但后端几乎没有中文维护注释，前端也只有极少数零星说明，Swagger 绝大部分接口和字段仍然停留在“能生成类型结构”的阶段。

这次变更不是单点代码美化，而是一次跨工具链、跨前后端、跨开发文档的工程治理：如果只改 import 风格而不补运行链路，后端会在 dev/build/test 里出现解析不一致；如果只补几处注释而不形成规则，后续新增代码很快会再次失去上下文；如果 Swagger 只保留类型而没有中文语义说明，接口使用者和评审者仍然很难快速理解业务边界。

## Goals / Non-Goals

**Goals:**

- 为 `apps/api` 建立与前端一致的 `@/` 根别名约定，并确保开发、测试、构建后的运行链路都能解析该别名。
- 收敛后端源文件中的多层相对导入，让跨目录依赖关系更稳定、更利于 review。
- 为前后端复杂业务逻辑、边界条件、兼容处理和非常规实现补充有维护价值的中文注释。
- 为 Swagger controller、DTO 和 VO 补充中文摘要、字段说明与关键语义说明，使接口文档对人可读。
- 把上述约定同步写入仓库开发文档和架构校验，避免本次治理只停留在一次性修改。

**Non-Goals:**

- 不在本次 change 中重写现有业务流程、接口协议或数据库模型。
- 不要求所有简单文件都堆满注释；注释重点仍然是职责、边界和为什么。
- 不把所有单层相对路径一刀切替换为 alias；同目录或一层目录引用仍可保留 `./`、`../`。
- 不在本次 change 中引入新的大型构建工具或替换 NestJS/Vue 既有栈。

## Decisions

### 1. 后端统一使用 `@/` 指向 `apps/api/src`，并补齐 dev/test/build/start 四条链路

Decision:

- 在 `apps/api/tsconfig.json` 中增加 `baseUrl` 和 `paths`，约定 `@/* -> src/*`。
- `ts-node-dev`、`ts-node` 执行的开发和 seed 流程通过 `tsconfig-paths/register` 解析 alias。
- `jest` 通过 `moduleNameMapper` 解析 `@/`。
- 构建后运行不改用新依赖做产物重写，而是通过独立的 runtime tsconfig 配合 `tsconfig-paths/register` 解析 `dist/src/*`。

Rationale:

- 这套方式完全基于仓库现有依赖即可落地，不需要额外下载新的 alias 重写工具。
- 把四条链路一次配齐后，后端导入风格就不会出现“本地能跑、构建后失效”或“测试能跑、开发失效”的分裂状态。
- 与前端统一使用 `@/` 后，团队在读前后端代码时可以共享同一套路径语义。

Alternatives considered:

- 继续保留多层相对路径：不需要改工具链，但会持续放大路径噪音和重构成本。
- 新增构建后 alias 重写工具：可行，但当前环境未预装依赖，本次 change 没必要为此增加额外外部依赖。

### 2. 多层跨目录导入统一改为 alias，单层近邻引用允许保留相对路径

Decision:

- `apps/api/src` 内部凡是出现两层及以上目录回退的导入，统一改为 `@/` 根别名。
- 同目录和单层近邻导入仍然允许使用 `./` 或 `../`，避免为了 alias 而失去局部可读性。

Rationale:

- 用户给出的要求本身就强调“一层可以相对路径，多层需要类似 @ 的稳定入口”。
- 这样既能解决最难读的 `../../../` 噪音，也不会把本来很近的依赖关系人为拉远。

Alternatives considered:

- 所有内部导入全部改成 alias：风格更统一，但会让局部文件之间的邻近关系变得不直观。
- 只对新文件生效、不回收旧文件：实现更快，但旧债会长期存在，校验也无法真正收口。

### 3. 中文注释采用“文件职责 + 关键分支说明”双层策略，而不是装饰性堆砌

Decision:

- 为前后端核心业务文件补充文件级职责说明，帮助维护者快速理解该文件处于哪一层、负责什么边界。
- 为复杂业务规则、数据范围校验、兼容性分支、空值归一化和副作用流程补充中文行内或块注释，解释为什么要这么做。
- 对简单 DTO、显而易见的 setter、纯样板模板结构避免过度注释。

Rationale:

- 用户明确要求前后端都要中文注释，但仓库文档也要求注释解释“为什么”而不是重复“做了什么”。
- “文件职责 + 关键分支说明”既能提高覆盖面，也能避免把仓库变成难维护的注释噪音。

Alternatives considered:

- 只给极少数复杂方法补注释：质量高但覆盖面太窄，无法回应这次对前后端整体可维护性的要求。
- 为所有语句逐行加注释：覆盖面大，但会明显降低代码可读性并制造维护负担。

### 4. Swagger 文档补齐面向接口使用者的中文语义，而不是只保留类型

Decision:

- controller 的 `@ApiOperation` 同时提供 `summary` 和 `description`，明确接口用途、适用场景和关键限制。
- DTO 的 `@ApiProperty` / `@ApiPropertyOptional` 补充中文字段说明、可选语义、枚举或时间格式说明。
- VO/Response DTO 对关键返回字段补充中文说明，特别是状态、范围、关联对象、分页字段和时间字段。

Rationale:

- 当前 Swagger 已经接入，但大多数字段说明为空，导致文档仍然需要回到代码里猜语义。
- 把中文说明放在契约层，比只写 README 更不容易和真实接口行为脱节。

Alternatives considered:

- 只保留 `summary`：成本低，但字段和返回结构仍然不够自解释。
- 只给 DTO 加字段说明、不补 VO：入参可读性提高，但返回文档仍然模糊。

### 5. 架构守卫采用“脚本收口 alias，review checklist 守住注释与 Swagger 质量”

Decision:

- `architecture:check` 新增后端多层相对导入检查，阻止新的 `../../` 风格回流到 `apps/api/src`。
- 中文注释质量和 Swagger 说明完整度主要通过 `docs/development.md` 的 checklist 明确要求，并在本次变更中补足现有核心文件。

Rationale:

- 多层相对导入是非常适合静态扫描的硬规则，可以直接阻止回归。
- 注释质量和 Swagger 说明深度更依赖语义判断，完全自动化很容易引入误报或鼓励敷衍填写。

Alternatives considered:

- 完全不加脚本，只靠 review：短期省事，但 alias 约束会再次退化。
- 强行把注释和 Swagger 质量也做成硬性静态校验：实现成本高，且难以准确衡量“是否有维护价值”。

## Risks / Trade-offs

- [Risk] alias 运行链路配置不完整会导致 dev、test、build 其中一条链路失效 -> Mitigation: 同步修改 tsconfig、runtime 启动脚本和 jest 配置，并做完整本地验证。
- [Risk] 批量替换 import 时可能误伤同名路径或测试依赖 -> Mitigation: 先限定在 `apps/api/src`，替换后用 TypeScript 检查和测试回归确认。
- [Risk] 批量补注释容易滑向“空话注释” -> Mitigation: 优先覆盖文件职责、规则分支和边界条件，避免重复代码表意。
- [Risk] Swagger 说明覆盖不均会让不同模块质量参差不齐 -> Mitigation: 先统一 controller、DTO、VO 三类文件的中文说明基线，再补最核心模块的字段细节。

## Migration Plan

- 第一步补齐 OpenSpec proposal、design、specs、tasks，把 alias、中文注释和 Swagger 文档纳入正式验收范围。
- 第二步修改 `apps/api` 的 TypeScript、开发启动、测试和运行配置，建立 `@/` 根别名解析链路。
- 第三步批量收敛 `apps/api/src` 内部多层相对导入，并为核心前后端文件补充中文职责说明和关键分支注释。
- 第四步为 controller、DTO、VO 补齐 Swagger 中文说明，并更新开发文档与架构校验。
- 第五步执行 `architecture:check`、`lint`、`test`、`build`，确认治理规则和实现状态一致。

## Open Questions

- 对于极少数简单 DTO 或纯类型文件，是否要求统一加文件级注释；本次默认仅对职责明显且经常被维护的核心文件补充。
- Swagger 字段说明是否需要为每个字段都补 `example`；本次优先保证 `description`、枚举语义和时间格式清晰，必要时再增补示例。
