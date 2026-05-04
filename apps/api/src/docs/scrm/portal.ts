import type { TagMetadata } from "../shared/portal-types";

export const SCRM_TAG_METADATA: TagMetadata[] = [
  {
    key: "customers",
    name: "客户管理",
    description:
      "客户主数据、标签、负责人分配、跟进记录与附件。做 CRM 主列表和详情页时优先看这里。典型联调链路：客户列表 -> 客户详情 -> 附件上传 / 下载 / 预览。常见限制是数据范围与负责人过滤。"
  },
  {
    key: "leads",
    name: "线索管理",
    description:
      "线索录入、分配、提醒、转化与跟进过程。做线索池、待办提醒、转客户链路时优先看这里。典型联调链路：创建线索 -> 线索详情 -> 转客户 -> 客户详情。常见限制是状态流转和可访问范围。"
  },
  {
    key: "sales-opportunities",
    name: "商机管理",
    description:
      "商机创建、阶段推进、赢单输单收口与经营字段。做销售主链路时通常在线索和客户之后阅读这里。典型联调链路：创建商机 -> 商机详情 -> 阶段推进 -> 赢单 / 输单收口。常见限制是阶段状态和动作权限。"
  },
  {
    key: "revenue-operations",
    name: "营收经营",
    description: "报价、合同、回款计划、回款记录与续费提醒。当前端已经完成商机链路后，再进入这部分衔接营收场景。"
  },
  {
    key: "uploads",
    name: "附件管理",
    description:
      "附件上传、下载、预览以及业务归属关系。做文件类交互时优先看这里。典型联调链路：上传 -> 详情页回查 `attachments` -> 下载 / 预览。常见问题是 MIME 类型、预览能力和下载响应头处理。"
  },
  {
    key: "batch-tasks",
    name: "导入导出任务",
    description: "异步导入导出、任务状态、失败明细和结果文件下载。做批量导入/导出页面时应优先查看。"
  }
];
