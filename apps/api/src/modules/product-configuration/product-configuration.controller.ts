import { Body, Controller, Get, Param, Patch, ParseEnumPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProductConfigScope } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { UpsertTenantConfigOverrideDto } from "./dto/upsert-tenant-config-override.dto";
import { ProductConfigurationService } from "./product-configuration.service";
import { ProductConfigEntryVo, ProductRuntimeConfigVo } from "./vo/product-configuration.vo";

@ApiTags("product-configuration")
@ApiBearerAuth()
@Controller("product-configuration")
export class ProductConfigurationController {
  constructor(private readonly productConfigurationService: ProductConfigurationService) {}

  @Get("runtime")
  @ApiOperation({
    summary: "查询当前租户运行时配置",
    description: "查询当前租户的菜单与主题运行时结果，用于宿主壳层展示。"
  })
  @ApiOkResponse({
    type: ProductRuntimeConfigVo
  })
  getRuntimeConfig(@CurrentUser() user: AuthUser) {
    return this.productConfigurationService.getRuntimeConfig(user);
  }

  @Get("entries")
  @Permissions("product-config:read")
  @ApiOperation({
    summary: "查询租户产品配置中心条目",
    description: "查询默认值、行业模板与租户覆盖值的继承结果。"
  })
  @ApiOkResponse({
    type: ProductConfigEntryVo,
    isArray: true
  })
  listResolvedEntries(@CurrentUser() user: AuthUser) {
    return this.productConfigurationService.listResolvedEntries(user);
  }

  @Patch("entries/:scope/:configKey")
  @Permissions("product-config:write")
  @ApiOperation({
    summary: "更新租户级产品配置覆盖值",
    description: "更新指定配置项的租户覆盖值，并保留默认值与行业模板继承关系。"
  })
  @ApiOkResponse({
    type: ProductConfigEntryVo
  })
  upsertTenantOverride(
    @Param("scope", new ParseEnumPipe(ProductConfigScope)) scope: ProductConfigScope,
    @Param("configKey") configKey: string,
    @Body() dto: UpsertTenantConfigOverrideDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.productConfigurationService.upsertTenantOverride(scope, configKey, dto, user);
  }
}
