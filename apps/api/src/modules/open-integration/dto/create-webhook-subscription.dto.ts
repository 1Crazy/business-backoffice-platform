import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WebhookSubscriptionStatus } from "@prisma/client";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateWebhookSubscriptionDto {
  @ApiProperty({
    description: "订阅名称。"
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "回调地址。"
  })
  @IsString()
  endpointUrl!: string;

  @ApiProperty({
    description: "订阅事件类型。",
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  eventTypes!: string[];

  @ApiPropertyOptional({
    description: "订阅状态。",
    enum: WebhookSubscriptionStatus
  })
  @IsOptional()
  @IsEnum(WebhookSubscriptionStatus)
  status?: WebhookSubscriptionStatus;

  @ApiPropertyOptional({
    description: "最大重试次数。"
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @ApiPropertyOptional({
    description: "单次请求超时时间（秒）。"
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  timeoutSeconds?: number;
}
