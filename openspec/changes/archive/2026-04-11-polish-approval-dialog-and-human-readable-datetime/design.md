## Context

这次 change 不是新增一个全新业务模块，而是把两处已经完成的体验修正纳入长期规范：

- OA 审批页原先使用浏览器原生 `prompt` 收集审批意见，和仓库中普遍采用的 `el-dialog` 交互风格不一致，也不利于后续补充审批摘要、校验和提交态。
- OA、SCRM 以及后续主应用原生页面在展示后端时间字段时，既会收到 ISO 字符串，也会收到前端表单产生的本地时间字符串。如果页面直接渲染原值，用户就会看到原始技术格式而不是业务可读时间。

因此本次设计目标不是重构后端时间契约，而是在前端展示层建立两个稳定约束：审批动作走结构化 dialog，用户可见时间统一格式化。

## Goals / Non-Goals

**Goals:**

- 为 OA 审批动作补充结构化对话框交互规范。
- 为多前端应用补充统一的人类可读时间展示规范。
- 让规范表达“用户看到什么”，而不是把 `prompt`、`append-to-body` 或某个 util 函数名这类实现细节写死。
- 让本次 change 可以直接同步进主 spec 并归档，不留下未完成工件。

**Non-Goals:**

- 不修改后端接口返回的时间字段格式。
- 不新增新的审批流程节点、必填意见校验或审批摘要模型。
- 不把所有历史页面都扩展成时间国际化方案；本次只定义当前仓库共享的统一可读格式基线。

## Decisions

### 1. 审批意见交互在规范层描述为“结构化 dialog”，而不是具体组件调用

Decision:
在 `office-automation-workspace` 中明确审批人通过/驳回时需要通过结构化审批 dialog 收集意见，而不是依赖浏览器原生输入框。

Rationale:

- 规范需要表达稳定的用户体验，而不是锁死到 `window.prompt` 的反面实现。
- “结构化 dialog”既能覆盖当前 `el-dialog` 实现，也给未来增加审批摘要、二次确认和更完整表单留出空间。

Alternatives considered:

- 只写“可填写审批意见”：太弱，无法避免再次退回浏览器原生弹框。
- 直接把 `el-dialog` 写进 spec：过度绑定当前组件库实现。

### 2. 时间格式规则放在共享视觉语言，而不是分散到每个业务 capability

Decision:
把“用户可见时间必须用统一可读格式展示，不直接暴露原始 ISO 串”的要求写入 `backoffice-visual-language`。

Rationale:

- 这是一条跨 OA、SCRM 和主应用的展示约束，本质上属于共享视觉与信息呈现规则。
- 如果分别写进公告、审批、提醒、审计日志和附件等业务 specs，会造成重复和维护负担。

Alternatives considered:

- 分别在每个业务 spec 中补时间展示要求：覆盖更细，但重复太多。
- 完全只依赖代码 util 约定：不足以形成主 spec 级别的长期约束。

### 3. 展示层格式化需要兼容 ISO 时间和本地时间字符串

Decision:
设计层明确前端展示格式化同时兼容后端 ISO 时间戳和前端表单已生成的本地时间字符串，并统一展示为 `YYYY-MM-DD HH:mm:ss`。

Rationale:

- 当前仓库同时存在两类时间源，如果盲目二次解析本地时间字符串，可能引入不必要的时区偏移。
- 规范层不需要规定具体解析算法，但设计需要记录这个兼容性约束，解释为什么采用展示层统一格式化而不是后端一次性改约定。

Alternatives considered:

- 只处理 ISO 时间：会遗漏前端已有的本地时间输入结果。
- 统一要求后端改返回格式：超出本次 change 范围，也不符合“只沉淀已实现行为”的目标。

## Risks / Trade-offs

- [Risk] 统一时间格式会弱化不同时区语义。 → Mitigation: 本次规范只约束当前后台界面的单一可读格式，不扩展到跨时区产品语义。
- [Risk] 把时间格式放进共享视觉语言，未来若某个业务需要特殊展示可能出现例外。 → Mitigation: 主 spec 先定义默认规则，业务确有特殊要求时再以 capability 级别显式覆盖。
- [Risk] 审批 dialog 当前仍是轻量输入框，规范过强可能被理解为必须做复杂表单。 → Mitigation: 规范只要求结构化 dialog 和意见输入，不要求额外字段或复杂校验。

## Migration Plan

- 第一步：创建并补全本次 OpenSpec change 的 proposal、design、tasks 与 delta specs。
- 第二步：通过 delta specs 将审批 dialog 与统一时间展示要求映射到 `office-automation-workspace` 和 `backoffice-visual-language`。
- 第三步：运行 `openspec validate` 校验变更结构。
- 第四步：执行 `openspec archive -y polish-approval-dialog-and-human-readable-datetime`，将 delta specs 同步进主 specs 并归档。
- 回滚策略：若同步结果不准确，可通过 git 恢复归档前状态并重新生成 change。

## Open Questions

- 当前统一格式固定为 `YYYY-MM-DD HH:mm:ss`。如果后续某些页面需要仅展示日期或需要明确时区标识，应再单独提出 change，而不是在本次归档中扩展范围。
