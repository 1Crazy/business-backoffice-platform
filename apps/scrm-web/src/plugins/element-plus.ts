/** 前端基础设施：统一配置 Element Plus 全局行为，避免共享组件默认文案回退为英文。 */
import zhCn from "element-plus/es/locale/lang/zh-cn";

// 在应用入口统一注入中文 locale，让分页、表格空态和日期面板等默认文案保持中文。
export const elementPlusOptions = {
  locale: zhCn
};
