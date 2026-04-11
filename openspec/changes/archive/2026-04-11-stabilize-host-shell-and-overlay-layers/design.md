## Context

这批代码不是“从零新增一个功能”，而是在主应用已经接入 `qiankun`、OA / SCRM 已经可以被承载的前提下，对两个真实联调痛点做补强：

- `main-web` 现有壳层已经具备统一导航，但最近的视觉与结构调整把侧边栏、顶部标题区和移动端菜单改成了更紧凑的门户版式，并且开始显式感知当前业务域。
- `scrm-web` 中多个 `el-dialog` / `el-drawer` 在独立运行时没有问题，但被主应用壳层承载后，会受到宿主内容区滚动和裁剪影响，导致弹层虽然触发了状态切换，却可能不出现在用户可见区域。

用户现在要的不是继续改代码，而是把已经发生的实现沉淀成规范，并完成归档与提交。因此本次设计重点是：

- 用一个 change 统一描述“主应用壳层稳定性”和“宿主模式下业务弹层稳定性”。
- 只把已经发生的行为变化写入规范，不扩展到未实现的交互重构。
- 让后续新增业务弹层时，团队能从主 spec 直接知道：在 `qiankun` 宿主模式下，覆盖层必须脱离宿主裁剪上下文。

## Goals / Non-Goals

**Goals:**

- 为主应用壳层补充当前业务域感知、导航分组展开和紧凑门户视觉的规范约束。
- 为 SCRM 宿主模式下的弹窗 / 抽屉建立统一的“不得被宿主裁切”规范。
- 把本次涉及的权限治理、系统管理、客户、线索和商机页面弹层行为同步回各自主 spec。
- 让本次 change 可以直接归档，不留下未完成工件或未同步的 delta spec。

**Non-Goals:**

- 不新增任何后端接口、数据模型或新的权限点。
- 不借这次 change 补写所有历史上遗漏的前端行为，只覆盖当前 git 改动实际触及的宿主壳层和弹层页面。
- 不在本次 change 中推广到 OA 新增对话框能力；OA 当前仅补做已有下拉与日期面板的宿主联调验证。

## Decisions

### 1. 用一个 change 同时承接壳层优化和弹层稳定性

Decision:
将主应用壳层优化与 SCRM 宿主弹层稳定性写入同一个 `stabilize-host-shell-and-overlay-layers` change。

Rationale:

- 两部分改动虽然分别位于 `main-web` 和 `scrm-web`，但都属于“被主应用承载后的体验稳定性”问题。
- 如果拆成两个 change，会出现一边描述宿主壳层，一边描述子应用弹层，但看不到它们之间的因果关系。
- 当前用户要求是基于现有 git 改动一次性补 OpenSpec、归档和提交，用一个 change 最符合当前代码现实。

Alternatives considered:

- 拆成“视觉改版”和“弹层修复”两个 change：语义更细，但会人为拉长本次整理流程。
- 只写弹层修复，不写壳层：无法反映本次 `main-web` 已有代码的行为变化。

### 2. 主应用壳层规范以“当前业务域可辨识”为核心

Decision:
在主应用相关 specs 中补充“当前业务域必须在导航与标题区持续可辨识”的要求，而不是把本次 CSS 细节逐条写进 spec。

Rationale:

- OpenSpec 需要描述可验证行为，而不是 `className`、变量名或具体配色值。
- 本次代码里的 `activeDomain`、子菜单展开、顶部标题压缩和移动菜单文案，本质上都服务于同一个目标：用户在 OA / SCRM 之间切换时能持续看懂自己当前在哪个域。
- 这样既能覆盖当前实现，也保留后续继续调整样式实现的空间。

Alternatives considered:

- 直接把“侧边栏宽度 228/232px”等实现写进 spec：过度绑定实现细节，不利于后续调整。
- 完全只写“视觉优化”：太泛，无法指导验收。

### 3. 宿主模式下的弹层问题由“覆盖层脱离宿主裁剪上下文”统一约束

Decision:
在相关业务 specs 中把宿主模式下的对话框和抽屉稳定性定义为显式要求：业务弹层打开后必须在主应用中完整可见，不得被宿主壳层裁切或遮挡。

Rationale:

- 当前实际代码通过给 `el-dialog` / `el-drawer` 补 `append-to-body` 解决问题，但规范层需要表达的是用户可观察到的结果，而不是实现手段本身。
- 把要求写成“完整可见、可操作、不被宿主裁切”后，将来即使 Element Plus 或宿主布局变化，团队也知道需要满足什么结果。
- 这类约束横跨多个 SCRM 页面，最适合在各业务 capability 下明确列出。

Alternatives considered:

- 只在 `backoffice-super-app-shell` 写一条总则：能描述宿主责任，但不利于业务能力层自测和回归。
- 只在代码注释里说明：不足以形成长期规范。

### 4. 每个受影响业务能力分别补一条宿主弹层 requirement

Decision:
对 `access-control`、`system-administration`、`customer-management`、`lead-followup`、`sales-opportunity-management` 分别新增宿主模式下弹层可用性 requirement。

Rationale:

- 这样主 spec 会直接告诉读者“哪个业务域有哪些弹层必须在主应用里正常工作”。
- 归档后主 specs 的变更更容易从能力边界理解，而不是被一条过于笼统的跨域 UI 规则吞掉。
- 这也和当前代码改动范围一一对应，便于审阅。

Alternatives considered:

- 用一个新的通用 capability 专门描述弹层：抽象过度，和现有 specs 结构不匹配。

## Risks / Trade-offs

- [Risk] 一个 change 同时覆盖视觉壳层与业务弹层，阅读范围较大 -> Mitigation: 在 proposal 与 specs 中按 capability 清晰分组，避免混写。
- [Risk] 规范若直接写 `append-to-body` 会过度锁死实现 -> Mitigation: specs 描述“宿主模式下完整可见”，实现细节只留在代码与设计文档。
- [Risk] 当前部分客户、线索、商机列表数据不足，联调验证只能覆盖新增类弹层 -> Mitigation: 在任务与提交说明中记录“已验证项”和“因数据缺失跳过项”，不夸大验证范围。

## Migration Plan

- 第一步：创建新的 OpenSpec change，并梳理本次 git 改动涉及的宿主壳层与业务能力范围。
- 第二步：编写 proposal、design、tasks 和各 capability 的 delta specs。
- 第三步：运行 `openspec validate` 确认 change 结构合法。
- 第四步：执行 `openspec archive -y`，将 delta specs 同步进主 specs 并归档到日期目录。
- 第五步：整理本次代码与 OpenSpec 归档产物，一并提交到 git。
- 回滚策略：若归档内容不准确，可从 git 历史恢复归档前状态，再重新生成 change。

## Open Questions

- 当前 OA 没有新增 `dialog` / `drawer` 组件改动，因此这次只把 OA 的宿主下拉与日期面板验证作为验证说明而非 spec 变更；如果后续 OA 也出现同类弹层问题，再单独补一个 change 会更清晰。
