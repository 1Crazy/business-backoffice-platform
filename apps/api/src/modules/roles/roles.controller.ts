import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RecordStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolesService } from "./roles.service";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions("role:read")
  list() {
    return this.rolesService.list();
  }

  @Get("permissions/catalog")
  @Permissions("role:read")
  getPermissionCatalog() {
    return this.rolesService.getPermissionCatalog();
  }

  @Post()
  @Permissions("role:write")
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthUser) {
    return this.rolesService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("role:write")
  update(@Param("id") id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: AuthUser) {
    return this.rolesService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("role:write")
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.rolesService.toggle(id, RecordStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("role:write")
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.rolesService.toggle(id, RecordStatus.DISABLED, user);
  }
}

