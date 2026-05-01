import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Res
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import type { Response } from "express";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { Public } from "@/common/decorators/public.decorator";
import { setRefreshTokenCookie, toClientLoginResponse } from "../auth/auth-cookie.util";
import {
  ConnectorLoginResponseVo,
  IdentityConnectorVo,
  OpenApiCredentialVo,
  OpenApiCustomerVo,
  PaginatedOpenApiCustomersResponseVo,
  WebhookDeliveryVo,
  WebhookSubscriptionVo
} from "./vo/open-integration.vo";
import { ConnectorLoginDto } from "./dto/connector-login.dto";
import { CreateIdentityConnectorDto } from "./dto/create-identity-connector.dto";
import { CreateOpenApiCredentialDto } from "./dto/create-open-api-credential.dto";
import { CreateWebhookSubscriptionDto } from "./dto/create-webhook-subscription.dto";
import { ListOpenApiCustomersDto } from "./dto/list-open-api-customers.dto";
import { UpdateIdentityConnectorDto } from "./dto/update-identity-connector.dto";
import { UpdateWebhookSubscriptionDto } from "./dto/update-webhook-subscription.dto";
import { OpenIntegrationService } from "./open-integration.service";

@ApiTags("open-integration")
@ApiBearerAuth()
@Controller("open-integration")
export class OpenIntegrationController {
  constructor(private readonly openIntegrationService: OpenIntegrationService) {}

  @Get("credentials")
  @Permissions("dictionary:read")
  @ApiOperation({
    summary: "查询租户 Open API 凭证",
    description: "查询当前租户的 Open API 凭证、权限范围和最近使用情况。"
  })
  @ApiOkResponse({
    type: OpenApiCredentialVo,
    isArray: true
  })
  listOpenApiCredentials(@CurrentUser() user: AuthUser) {
    return this.openIntegrationService.listOpenApiCredentials(user);
  }

  @Post("credentials")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "创建租户 Open API 凭证",
    description: "创建新的租户级 API 凭证，并返回一次性的明文密钥。"
  })
  @ApiOkResponse({
    type: OpenApiCredentialVo
  })
  createOpenApiCredential(@Body() dto: CreateOpenApiCredentialDto, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.createOpenApiCredential(dto, user);
  }

  @Post("credentials/:id/rotate")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "轮换租户 Open API 凭证密钥",
    description: "轮换指定凭证的密钥，并返回新的明文密钥。"
  })
  @ApiOkResponse({
    type: OpenApiCredentialVo
  })
  rotateOpenApiCredential(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.rotateOpenApiCredential(id, user);
  }

  @Post("credentials/:id/revoke")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "撤销租户 Open API 凭证",
    description: "撤销指定 Open API 凭证，后续访问将被拒绝。"
  })
  @ApiOkResponse({
    type: OpenApiCredentialVo
  })
  revokeOpenApiCredential(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.revokeOpenApiCredential(id, user);
  }

  @Get("webhooks")
  @Permissions("dictionary:read")
  @ApiOperation({
    summary: "查询租户 Webhook 订阅",
    description: "查询当前租户的 Webhook 订阅、签名密钥摘要和最近投递状态。"
  })
  @ApiOkResponse({
    type: WebhookSubscriptionVo,
    isArray: true
  })
  listWebhookSubscriptions(@CurrentUser() user: AuthUser) {
    return this.openIntegrationService.listWebhookSubscriptions(user);
  }

  @Post("webhooks")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "创建租户 Webhook 订阅",
    description: "创建新的租户级 Webhook 订阅，并返回一次性的签名密钥。"
  })
  @ApiOkResponse({
    type: WebhookSubscriptionVo
  })
  createWebhookSubscription(@Body() dto: CreateWebhookSubscriptionDto, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.createWebhookSubscription(dto, user);
  }

  @Patch("webhooks/:id")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "更新租户 Webhook 订阅",
    description: "更新回调地址、事件范围、重试策略或轮换签名密钥。"
  })
  @ApiOkResponse({
    type: WebhookSubscriptionVo
  })
  updateWebhookSubscription(
    @Param("id") id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.openIntegrationService.updateWebhookSubscription(id, dto, user);
  }

  @Post("webhooks/:id/test")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "触发 Webhook 测试投递",
    description: "按当前订阅配置模拟一次 Webhook 投递，并记录重试和投递历史。"
  })
  @ApiOkResponse({
    type: WebhookDeliveryVo
  })
  triggerWebhookTest(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.triggerWebhookTest(id, user);
  }

  @Get("webhooks/:id/deliveries")
  @Permissions("dictionary:read")
  @ApiOperation({
    summary: "查询 Webhook 投递历史",
    description: "查询指定订阅的最近投递历史与失败信息。"
  })
  @ApiOkResponse({
    type: WebhookDeliveryVo,
    isArray: true
  })
  listWebhookDeliveries(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.listWebhookDeliveries(id, user);
  }

  @Get("connectors")
  @Permissions("dictionary:read")
  @ApiOperation({
    summary: "查询企业身份连接器",
    description: "查询当前租户的 SSO、LDAP 或 OAuth 连接器配置。"
  })
  @ApiOkResponse({
    type: IdentityConnectorVo,
    isArray: true
  })
  listIdentityConnectors(@CurrentUser() user: AuthUser) {
    return this.openIntegrationService.listIdentityConnectors(user);
  }

  @Post("connectors")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "创建企业身份连接器",
    description: "创建新的企业身份连接器，并与当前租户绑定。"
  })
  @ApiOkResponse({
    type: IdentityConnectorVo
  })
  createIdentityConnector(@Body() dto: CreateIdentityConnectorDto, @CurrentUser() user: AuthUser) {
    return this.openIntegrationService.createIdentityConnector(dto, user);
  }

  @Patch("connectors/:id")
  @Permissions("dictionary:write")
  @ApiOperation({
    summary: "更新企业身份连接器",
    description: "更新连接器状态、映射字段与扩展配置。"
  })
  @ApiOkResponse({
    type: IdentityConnectorVo
  })
  updateIdentityConnector(
    @Param("id") id: string,
    @Body() dto: UpdateIdentityConnectorDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.openIntegrationService.updateIdentityConnector(id, dto, user);
  }

  @Post("connectors/:id/login")
  @Public()
  @ApiOperation({
    summary: "企业身份连接器登录",
    description: "接受外部身份源回传的主体信息，映射到当前租户用户并签发会话。"
  })
  @ApiOkResponse({
    type: ConnectorLoginResponseVo
  })
  async loginWithIdentityConnector(
    @Param("id") id: string,
    @Body() dto: ConnectorLoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const loginResponse = await this.openIntegrationService.loginWithIdentityConnector(id, dto);
    setRefreshTokenCookie(response, loginResponse.refreshToken);
    return toClientLoginResponse(loginResponse);
  }
}

@ApiTags("open-api")
@Controller("open-api")
export class OpenApiController {
  constructor(private readonly openIntegrationService: OpenIntegrationService) {}

  @Get("customers")
  @Public()
  @ApiHeader({
    name: "x-open-api-key",
    required: true
  })
  @ApiHeader({
    name: "x-open-api-secret",
    required: true
  })
  @ApiOperation({
    summary: "租户级 Open API 客户列表",
    description: "使用 Open API 凭证访问当前租户的客户列表。"
  })
  @ApiOkResponse({
    type: PaginatedOpenApiCustomersResponseVo
  })
  listCustomers(
    @Query() query: ListOpenApiCustomersDto,
    @Headers("x-open-api-key") accessKey?: string,
    @Headers("x-open-api-secret") secret?: string
  ) {
    return this.openIntegrationService.listOpenApiCustomers(query, accessKey, secret);
  }

  @Get("customers/:id")
  @Public()
  @ApiHeader({
    name: "x-open-api-key",
    required: true
  })
  @ApiHeader({
    name: "x-open-api-secret",
    required: true
  })
  @ApiOperation({
    summary: "租户级 Open API 客户详情",
    description: "使用 Open API 凭证访问当前租户的客户详情。"
  })
  @ApiOkResponse({
    type: OpenApiCustomerVo
  })
  getCustomerDetail(
    @Param("id") id: string,
    @Headers("x-open-api-key") accessKey?: string,
    @Headers("x-open-api-secret") secret?: string
  ) {
    return this.openIntegrationService.getOpenApiCustomerDetail(id, accessKey, secret);
  }
}
