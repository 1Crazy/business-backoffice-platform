/** roles 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RecordStatus } from "@prisma/client";

import { PermissionVo, RoleVo } from "@/common/vo/access-control.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@ApiTags("roles")
@ApiBearerAuth()
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("role:read")
  @ApiOperation({
    summary: "查询角色列表",
    description: "查询角色列表。"
  })
  @ApiOkResponse({
    type: RoleVo,
    isArray: true
  })
  list() {
    return this.rolesService.list();
  }

  @Get("permissions/catalog")
  @Permissions("role:read")
  @ApiOperation({
    summary: "查询权限目录",
    description: "查询权限目录。"
  })
  @ApiOkResponse({
    type: PermissionVo,
    isArray: true
  })
  getPermissionCatalog() {
    return this.rolesService.getPermissionCatalog();
  }

  @Post()
  @Permissions("role:write")
  @ApiOperation({
    summary: "创建角色",
    description: "创建角色。"
  })
  @ApiOkResponse({
    type: RoleVo
  })
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    return this.rolesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("role:write")
  @ApiOperation({
    summary: "更新角色",
    description: "更新角色。"
  })
  @ApiOkResponse({
    type: RoleVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: AuthUser) {
    return this.rolesService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("role:write")
  @ApiOperation({
    summary: "启用角色",
    description: "启用角色。"
  })
  @ApiOkResponse({
    type: RoleVo
  })
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.rolesService.toggle(id, RecordStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("role:write")
  @ApiOperation({
    summary: "停用角色",
    description: "停用角色。"
  })
  @ApiOkResponse({
    type: RoleVo
  })
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.rolesService.toggle(id, RecordStatus.DISABLED, user);
  }
}
