import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IdentityConnectorMatchField,
  IdentityConnectorType,
  OpenApiCredentialStatus,
  RecordStatus,
  WebhookDeliveryStatus,
  WebhookSubscriptionStatus
} from "@prisma/client";

import { PaginatedResponseDto } from "@/common/pagination/paginated-response.dto";
import { LoginResponseVo } from "@/modules/auth/vo/auth.vo";

export class OpenApiCredentialVo {
  @ApiProperty({
    description: "Open API 凭证 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "Open API 凭证名称。"
  })
  name!: string;

  @ApiProperty({
    description: "Open API 访问键标识。"
  })
  accessKey!: string;

  @ApiProperty({
    type: () => [String]
  })
  scopes!: string[];

  @ApiProperty({
    enum: OpenApiCredentialStatus
  })
  status!: OpenApiCredentialStatus;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  expiresAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastUsedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  rotatedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  revokedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  createdByName?: string | null;

  @ApiPropertyOptional({
    description: "仅创建或轮换时返回的明文密钥。",
    nullable: true
  })
  plainSecret?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class WebhookDeliveryVo {
  @ApiProperty({
    description: "Webhook 投递记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "Webhook 事件类型。"
  })
  eventType!: string;

  @ApiProperty({
    description: "Webhook 事件来源对象类型。"
  })
  sourceType!: string;

  @ApiProperty({
    description: "Webhook 事件来源对象 ID。"
  })
  sourceId!: string;

  @ApiProperty({
    enum: WebhookDeliveryStatus
  })
  status!: WebhookDeliveryStatus;

  @ApiProperty({
    description: "投递尝试次数。"
  })
  attemptCount!: number;

  @ApiProperty({
    enum: ["REAL", "SIMULATION"],
    description: "测试投递模式。REAL 表示真实 HTTP 投递，SIMULATION 表示服务端模拟结果。"
  })
  deliveryMode!: "REAL" | "SIMULATION";

  @ApiPropertyOptional({
    nullable: true,
    description: "真实投递或模拟计算耗时，单位毫秒。"
  })
  durationMs?: number | null;

  @ApiProperty({
    description: "本次投递签名。"
  })
  signature!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  responseStatusCode?: number | null;

  @ApiPropertyOptional({
    nullable: true
  })
  responseBody?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  errorMessage?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  nextRetryAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  deliveredAt?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;
}

export class WebhookSubscriptionVo {
  @ApiProperty({
    description: "Webhook 订阅 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "Webhook 订阅名称。"
  })
  name!: string;

  @ApiProperty({
    description: "Webhook 目标地址。"
  })
  endpointUrl!: string;

  @ApiProperty({
    type: () => [String]
  })
  eventTypes!: string[];

  @ApiProperty({
    enum: WebhookSubscriptionStatus
  })
  status!: WebhookSubscriptionStatus;

  @ApiProperty({
    description: "签名密钥提示。"
  })
  signingSecretHint!: string;

  @ApiProperty({
    description: "最大重试次数。"
  })
  maxAttempts!: number;

  @ApiProperty({
    description: "请求超时时间，单位秒。"
  })
  timeoutSeconds!: number;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastTriggeredAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    enum: WebhookDeliveryStatus
  })
  lastDeliveryStatus?: WebhookDeliveryStatus | null;

  @ApiPropertyOptional({
    nullable: true
  })
  lastFailureMessage?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  createdByName?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  updatedByName?: string | null;

  @ApiPropertyOptional({
    description: "仅创建或轮换时返回的明文签名密钥。",
    nullable: true
  })
  plainSigningSecret?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class IdentityConnectorVo {
  @ApiProperty({
    description: "身份连接器 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "身份连接器名称。"
  })
  name!: string;

  @ApiProperty({
    enum: IdentityConnectorType
  })
  type!: IdentityConnectorType;

  @ApiProperty({
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiProperty({
    enum: IdentityConnectorMatchField
  })
  matchField!: IdentityConnectorMatchField;

  @ApiPropertyOptional({
    nullable: true
  })
  issuerUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  authorizeUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  tokenUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  directoryUrl?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  clientId?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  clientSecretHint?: string | null;

  @ApiProperty({
    type: () => [String]
  })
  allowedDomains!: string[];

  @ApiPropertyOptional({
    nullable: true,
    type: "object",
    additionalProperties: true
  })
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastAuthenticatedAt?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    format: "date-time"
  })
  lastFailureAt?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  lastFailureMessage?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  createdByName?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  updatedByName?: string | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class OpenApiCustomerOwnerVo {
  @ApiProperty({
    description: "客户负责人员工 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "客户负责人姓名。"
  })
  displayName!: string;
}

export class OpenApiCustomerTagVo {
  @ApiProperty({
    description: "客户标签 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "客户标签名称。"
  })
  name!: string;
}

export class OpenApiCustomerVo {
  @ApiProperty({
    description: "客户 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "客户名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    nullable: true
  })
  contactName?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  phone?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  email?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  source?: string | null;

  @ApiPropertyOptional({
    nullable: true
  })
  status?: string | null;

  @ApiProperty({
    description: "客户负责人信息。",
    type: () => OpenApiCustomerOwnerVo
  })
  owner!: OpenApiCustomerOwnerVo;

  @ApiProperty({
    description: "客户标签列表。",
    type: () => [OpenApiCustomerTagVo]
  })
  tags!: OpenApiCustomerTagVo[];

  @ApiProperty({
    description: "客户创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "客户更新时间。",
    format: "date-time"
  })
  updatedAt!: string;
}

export class PaginatedOpenApiCustomersResponseVo extends PaginatedResponseDto {
  @ApiProperty({
    type: () => [OpenApiCustomerVo]
  })
  items!: OpenApiCustomerVo[];
}

export class ConnectorLoginResponseVo extends LoginResponseVo {}
