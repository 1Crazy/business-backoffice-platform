## ADDED Requirements

### Requirement: 前端共享组件默认文案与后台界面语言一致
对于全局挂载的前端 UI 组件库，系统实现 SHALL 在应用启动层统一配置默认 locale，使分页、表格空数据提示、日期和其他共享组件默认文案与后台界面主语言保持一致。当前仓库的后台主语言为中文，因此默认 fallback 文案 MUST 以中文呈现，而不是回退为英文。

#### Scenario: Element Plus 默认分页文案显示为中文
- **WHEN** 页面使用 `el-pagination` 且未手工覆写其默认提示文案
- **THEN** 分页器展示的总数、跳转或每页条数等默认文本以中文呈现

#### Scenario: Element Plus 默认表格空态显示为中文
- **WHEN** 页面直接渲染 `el-table` 且数据为空，并依赖组件默认空态提示
- **THEN** 表格显示中文空数据提示，而不是英文的 `No Data`

#### Scenario: 业务级空态文案优先于组件默认 fallback
- **WHEN** 页面已经显式声明更具体的业务空态，例如筛选结果为空、暂无待办或暂无附件
- **THEN** 实现保留这些业务级中文文案，而不是被统一默认文案覆盖
