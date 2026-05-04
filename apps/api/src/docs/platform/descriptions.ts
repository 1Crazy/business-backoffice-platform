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
    "IdentityConnectorVo.id": "身份连接器 ID，用于标识单个 SSO 或外部身份源接入配置。"
  }
};
