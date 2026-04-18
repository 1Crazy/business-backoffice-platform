import { PartialType } from "@nestjs/swagger";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

import { CreateWebhookSubscriptionDto } from "./create-webhook-subscription.dto";

export class UpdateWebhookSubscriptionDto extends PartialType(CreateWebhookSubscriptionDto) {
  @ApiPropertyOptional({
    description: "是否重新生成签名密钥。"
  })
  @IsOptional()
  @IsBoolean()
  rotateSecret?: boolean;
}
