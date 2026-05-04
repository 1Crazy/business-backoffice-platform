import type { TagMetadata } from "../shared/portal-types";

export const PLATFORM_TAG_METADATA: TagMetadata[] = [
  {
    key: "dashboard",
    name: "经营看板",
    description: "经营概览、趋势指标与业务统计聚合接口。"
  },
  {
    key: "audit-logs",
    name: "审计日志",
    description: "安全审计、操作追踪、查询筛选与归档信息。"
  },
  {
    key: "system-governance",
    name: "系统治理",
    description: "渠道治理、存储治理、调度治理与隐私合规操作。"
  },
  {
    key: "tenant-operations",
    name: "租户管理",
    description: "租户开通、停用、归档与配额管理。"
  },
  {
    key: "product-configuration",
    name: "产品配置",
    description: "运行时产品配置项与租户级覆盖策略。"
  },
  {
    key: "dictionaries",
    name: "数据字典",
    description: "字典项维护、查询与配置化枚举源。"
  },
  {
    key: "open-integration",
    name: "开放集成",
    description:
      "Webhook、身份连接器与租户级集成配置。做外部系统回调、单点登录或租户级集成时优先看这里。典型联调链路：创建凭证 / 创建 Webhook -> 测试投递 -> 查看投递历史。"
  },
  {
    key: "open-api",
    name: "开放 API",
    description:
      "面向外部系统调用的开放接口数据面。外部系统通过 `x-open-api-key` / `x-open-api-secret` 鉴权时应先看这里。典型联调链路：创建 Open API 凭证 -> 调用 `/api/open-api/*` 列表 / 详情接口。"
  }
];
