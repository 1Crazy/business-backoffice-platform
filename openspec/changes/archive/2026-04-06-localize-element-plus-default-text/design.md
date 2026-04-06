## Context

当前前端入口 [main.ts](/Users/hong/Documents/my-project/scrm-test/apps/web/src/main.ts) 直接通过 `app.use(ElementPlus)` 挂载组件库，没有注入 locale 配置。仓库中的业务页已经大量使用中文标题、按钮和空态文案，但一旦页面依赖 Element Plus 的默认分页文案、默认表格空数据提示或其他共享组件默认值，就会回退成英文，形成明显的语言割裂。

这个问题的关键不在单个页面，而在应用启动层。只在某几个表格上补 `empty-text` 或在某几个分页器上手工改 slot，无法阻止后续新增页面继续出现英文默认文案；真正需要收口的是组件库的全局默认语言。

## Goals / Non-Goals

**Goals:**

- 在前端应用入口统一为 Element Plus 注入中文 locale，让分页、表格空态等共享组件默认文案自动切换为中文。
- 保留现有页面里已经写好的业务级中文空态，不因为全局 locale 改动而丢失更细粒度的业务表达。
- 为这类前端基础设施约束补充 OpenSpec 和开发文档，避免后续回退。
- 增加一个可自动验证的前端测试点，确保全局 locale 不会在后续改动中被悄悄移除。

**Non-Goals:**

- 不在本次 change 中引入完整的多语言框架，也不做中英切换功能。
- 不批量重写所有业务文案；本次只解决组件库默认英文 fallback。
- 不为每个分页器和表格逐个复制一套中文文案，除非页面需要特殊业务语义。

## Decisions

### 1. 通过前端启动层统一配置 Element Plus 中文 locale

Decision:

- 在前端启动链路中为 Element Plus 注入 `zh-cn` locale，而不是在页面组件里逐个传入 locale 或手工覆写分页/表格文本。

Rationale:

- 分页、表格空态、日期等默认文案都属于组件库级共享行为，最合适的收口点就是全局安装入口。
- 统一配置后，现有页面和未来新增页面都能自动继承中文默认值，长期维护成本最低。

Alternatives considered:

- 在每个 `el-pagination` 或 `el-table` 上单独写中文 props：能修局部问题，但会制造重复配置，也无法兜住新页面。
- 在页面根组件里用多个局部 `el-config-provider` 包裹：可行，但粒度过细，不适合作为仓库默认约束。

### 2. 抽离独立的 Element Plus 配置模块，提高可读性与可测试性

Decision:

- 将 Element Plus 的全局安装选项抽到独立模块，例如 `apps/web/src/plugins/element-plus.ts`，由 `main.ts` 负责消费。

Rationale:

- 这样可以避免把第三方组件库配置埋在启动文件里，也更容易为 locale 做单元测试。
- 后续如果需要继续追加 size、zIndex、namespace 等全局配置，可以在同一位置扩展，而不用再次改动入口文件结构。

Alternatives considered:

- 直接在 `main.ts` 里内联 locale 配置：实现更快，但测试和后续扩展都不够友好。

### 3. 继续保留业务级空态文案，只有通用 fallback 才依赖 locale

Decision:

- 页面里已经显式声明的业务空态文案继续保留，例如“当前筛选和数据范围下暂无客户”；只有通用表格空态、分页器默认文字等 fallback 交给 Element Plus locale 统一处理。

Rationale:

- 业务级空态通常比组件默认文案更具体，直接替换成统一的“暂无数据”反而会损失语义。
- 用户当前反馈的核心问题也是“默认英文没收口”，不是要抹平所有页面差异。

Alternatives considered:

- 把所有页面空态全部改成统一默认文案：改动大，而且会降低业务表达清晰度。

### 4. 用前端单测守住 locale 配置存在性

Decision:

- 为抽离出的 Element Plus 配置模块增加一个简单单测，验证默认 locale 已经指向中文，并能覆盖分页/表格这类典型默认文案。

Rationale:

- 这个问题很容易在重构入口文件时被忽略，增加一个轻量测试比只靠人工记忆更稳。
- 配置模块级测试不依赖完整页面挂载，执行成本低，反馈清晰。

Alternatives considered:

- 只依赖人工浏览器检查：能发现问题，但回归成本高，也不适合长期守护。

## Risks / Trade-offs

- [Risk] 只改全局 locale 但没有测试，后续入口重构时容易回退 -> Mitigation: 增加独立配置模块和轻量单元测试。
- [Risk] 某些页面已经自定义空态文案，开发者可能误以为全局 locale 会统一替换全部文案 -> Mitigation: 在设计和文档里明确区分“业务级空态”和“组件默认 fallback”。
- [Risk] 组件库 locale 更新后，个别默认翻译可能与团队术语不完全一致 -> Mitigation: 当前先以仓库整体中文化为目标，如后续有术语偏好，再局部覆盖而不是放弃全局 locale。

## Migration Plan

- 第一步补齐 OpenSpec proposal、design、spec 和 tasks，明确这次属于前端基础设施中文化修复。
- 第二步新增前端 Element Plus 配置模块，并在应用入口接入中文 locale。
- 第三步盘点当前依赖默认分页和空态文案的页面，确认无需额外局部修补或仅保留业务级空态。
- 第四步补充开发文档与正式 spec，并执行前端 lint、test、build 验证。

## Open Questions

- 当前没有阻塞实现的未决问题；如果后续要扩展为可切换语言，再在独立 change 中引入正式 i18n 方案。
