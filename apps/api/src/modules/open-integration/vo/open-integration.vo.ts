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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  eventType!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  sourceId!: string;

  @ApiProperty({
    enum: WebhookDeliveryStatus
  })
  status!: WebhookDeliveryStatus;

  @ApiProperty()
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

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  endpointUrl!: string;

  @ApiProperty({
    type: () => [String]
  })
  eventTypes!: string[];

  @ApiProperty({
    enum: WebhookSubscriptionStatus
  })
  status!: WebhookSubscriptionStatus;

  @ApiProperty()
  signingSecretHint!: string;

  @ApiProperty()
  maxAttempts!: number;

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
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
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayName!: string;
}

export class OpenApiCustomerTagVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class OpenApiCustomerVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
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
    type: () => OpenApiCustomerOwnerVo
  })
  owner!: OpenApiCustomerOwnerVo;

  @ApiProperty({
    type: () => [OpenApiCustomerTagVo]
  })
  tags!: OpenApiCustomerTagVo[];

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
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
