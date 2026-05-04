import { CORE_TAG_METADATA } from "./core/portal";
import { OA_TAG_METADATA } from "./oa/portal";
import { PLATFORM_TAG_METADATA } from "./platform/portal";
import { SCRM_TAG_METADATA } from "./scrm/portal";
import type { TagMetadata } from "./shared/portal-types";

const TAG_METADATA: TagMetadata[] = [
  ...CORE_TAG_METADATA,
  ...SCRM_TAG_METADATA,
  ...OA_TAG_METADATA,
  ...PLATFORM_TAG_METADATA
];

const TAG_NAME_MAP = new Map(TAG_METADATA.map((item) => [item.key, item.name]));

export function buildDocsOverviewMarkdown(): string {
  return [
    "## 文档定位",
    "这是业务中台后端的企业内部 API 文档门户，面向前端联调、内部集成与问题排查。",
    "阅读入口是 `/docs`，试调入口是 `/docs/debug`，原始规范入口是 `/docs-json`。",
    "",
    "## 3 分钟上手",
    "1. 调用 `POST /api/auth/login` 发起登录。",
    "2. 如果返回 `mfaRequired=true`，继续调用 `POST /api/auth/mfa/login/verify`。",
    "3. 登录成功后调用 `GET /api/auth/profile` 获取权限与数据范围。",
    "4. 再进入客户、线索、商机等主业务链路联调。",
    "",
    "## 推荐阅读顺序",
    "1. 认证与会话",
    "2. 客户管理 / 线索管理",
    "3. 商机管理 / 营收经营",
    "4. 附件管理 / 导入导出任务",
    "5. 开放集成 / 开放 API",
    "",
    "## 联调前检查",
    "- PostgreSQL 已启动：`pnpm docker:infra`。",
    "- API 已启动：`pnpm dev:api`。",
    "- 浏览器已建立 Token / Cookie。",
    "- 已通过 `/api/auth/profile` 确认 `dataScopes` 和权限。",
    "",
    "## 联调剧本入口",
    "1. 登录初始化",
    "2. 线索转客户",
    "3. 客户到赢单",
    "详细步骤请结合对应业务分组描述与接口 examples 阅读。",
    "",
    "## 通用约定",
    "- 需要鉴权的接口统一使用 Bearer Token。",
    "- 登录与刷新链路涉及 HttpOnly Cookie 和 CSRF 约束。",
    "- 分页骨架统一为 `items/page/pageSize/total/totalPages/sortBy/sortOrder`。",
    "- 所有时间字段默认使用 ISO 8601 日期时间字符串。",
    "",
    "常见问题：`/docs` 打不开、登录后列表为空、`refresh` 不生效、附件不能预览。请到对应业务分组查看。"
  ].join("\n");
}

export function buildTagGroups() {
  return [
    {
      name: "开始联调",
      tags: ["认证与会话", "用户管理", "角色与权限"]
    },
    {
      name: "销售主链路",
      tags: ["线索管理", "客户管理", "商机管理", "营收经营"]
    },
    {
      name: "文件与异步任务",
      tags: ["附件管理", "导入导出任务"]
    },
    {
      name: "对外集成",
      tags: ["开放集成", "开放 API"]
    },
    {
      name: "平台与组织",
      tags: [
        "部门组织",
        "工作流",
        "通知中心",
        "经营看板",
        "审计日志",
        "办公协同",
        "系统治理",
        "租户管理",
        "产品配置",
        "数据字典",
        "统一工作台"
      ]
    }
  ];
}

export function getTagMetadata(): TagMetadata[] {
  return TAG_METADATA;
}

export function getTranslatedTagName(tag: string): string {
  return TAG_NAME_MAP.get(tag) ?? tag;
}
