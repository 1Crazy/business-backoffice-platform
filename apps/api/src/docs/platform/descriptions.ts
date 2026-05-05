import type { SchemaDescriptionModule } from "../shared/schema-descriptions";

export const PLATFORM_SCHEMA_DESCRIPTIONS: SchemaDescriptionModule = {
  propertyDescriptions: {
    "TenantOperationsSnapshotVo.id": "租户 ID。",
    "TenantOperationsSnapshotVo.code": "租户编码。",
    "TenantOperationsSnapshotVo.name": "租户名称。",
    "OpenApiCredentialVo.id": "Open API 凭证 ID，用于轮换、停用和审计定位。",
    "OpenApiCredentialVo.accessKey": "对外展示的访问键标识；调用方通常结合密钥完成接口鉴权。",
    "WebhookDeliveryVo.id": "单次 Webhook 投递记录 ID，用于重试、排障和回执追踪。",
    "WebhookDeliveryVo.sourceType": "触发本次 Webhook 事件的业务对象类型，用于解释 sourceId 指向的实体类别。",
    "WebhookDeliveryVo.sourceId": "触发本次 Webhook 事件的业务对象 ID；具体对象类型由 sourceType 标识。",
    "WebhookSubscriptionVo.id": "Webhook 订阅 ID，用于管理订阅配置和查询投递历史。",
    "IdentityConnectorVo.id": "身份连接器 ID，用于标识单个 SSO 或外部身份源接入配置。",
    "TenantOperationsSnapshotVo.lifecycleStatus":
      "租户生命周期状态。ACTIVE=正常可用；DISABLED=已停用但未归档；ARCHIVED=已归档，不再参与日常运行。",
    "WebhookDeliveryVo.deliveryMode":
      "测试投递模式。REAL=真实发起 HTTP 回调；SIMULATION=仅在服务端模拟投递结果，不触达外部地址。"
  },
  enumDescriptions: {
    RecordStatus: {
      ACTIVE: "记录处于启用生效状态。",
      DISABLED: "记录已停用，保留但不再正常参与业务。"
    },
    GovernanceHealthStatus: {
      HEALTHY: "运行状态健康，当前未发现治理风险。",
      WARNING: "存在需要关注的风险或配置缺口，但尚未完全阻断使用。",
      ERROR: "存在明确异常或高风险问题，需要尽快处理。"
    },
    BatchTaskCategory: {
      IMPORT: "导入任务，将外部数据写入系统。",
      EXPORT: "导出任务，将系统数据导出到文件。"
    },
    BatchTaskStatus: {
      PENDING: "任务已创建，等待调度执行。",
      RUNNING: "任务执行中。",
      SUCCEEDED: "任务已成功完成。",
      FAILED: "任务执行失败。"
    },
    AttachmentStorageProvider: {
      LOCAL: "使用本地磁盘存储附件。",
      OBJECT_STORAGE: "使用对象存储服务存放附件。"
    },
    OpenApiCredentialStatus: {
      ACTIVE: "凭证可正常用于开放 API 鉴权。",
      REVOKED: "凭证已撤销，不能再用于鉴权。"
    },
    WebhookSubscriptionStatus: {
      ACTIVE: "订阅已启用，匹配事件会继续投递。",
      DISABLED: "订阅已停用，不再触发投递。"
    },
    WebhookDeliveryStatus: {
      PENDING: "投递已入队，等待执行或重试。",
      SUCCEEDED: "投递已成功到达目标端并收到成功响应。",
      FAILED: "投递失败，已达到当前失败状态。"
    },
    IdentityConnectorType: {
      SSO: "基于单点登录协议的身份连接器。",
      LDAP: "基于 LDAP 目录服务的身份连接器。",
      OAUTH: "基于 OAuth/OIDC 授权流程的身份连接器。"
    },
    IdentityConnectorMatchField: {
      USERNAME: "使用外部身份中的用户名匹配本系统员工账号。",
      EMAIL: "使用外部身份中的邮箱地址匹配本系统员工账号。"
    },
    SchedulerJobStatus: {
      RUNNING: "调度任务已启用，会按 cron 正常执行。",
      PAUSED: "调度任务已暂停，不会继续自动执行。"
    },
    SchedulerExecutionStatus: {
      RUNNING: "本次调度执行仍在进行中。",
      SUCCEEDED: "本次调度执行成功完成。",
      FAILED: "本次调度执行失败。"
    },
    ProductConfigLayer: {
      PLATFORM_DEFAULT: "平台默认层，系统内置的基线配置。",
      INDUSTRY_TEMPLATE: "行业模板层，面向特定行业场景的预置配置。",
      TENANT_OVERRIDE: "租户覆盖层，当前租户自定义并覆盖上层配置。"
    },
    ProductConfigScope: {
      MENU: "菜单导航配置。",
      FIELD_SCHEME: "字段方案配置。",
      FORM_TEMPLATE: "表单模板配置。",
      THEME: "主题品牌配置。",
      TEMPLATE: "通用业务模板配置。"
    }
  }
};
