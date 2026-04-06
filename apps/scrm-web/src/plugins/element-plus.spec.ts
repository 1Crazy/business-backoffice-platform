/** 单测：守住 Element Plus 默认文案中文化，避免分页和表格空态回退为英文。 */
import { elementPlusOptions } from "@/plugins/element-plus";

describe("elementPlusOptions", () => {
  it("uses zh-cn locale for shared component fallback copy", () => {
    expect(elementPlusOptions.locale.name).toBe("zh-cn");
    expect(elementPlusOptions.locale.el.pagination.total).toBe("共 {total} 条");
    expect(elementPlusOptions.locale.el.pagination.goto).toBe("前往");
    expect(elementPlusOptions.locale.el.table.emptyText).toBe("暂无数据");
  });
});
