/** users 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserStatus } from "@prisma/client";

import { UserVo } from "@/common/vo/access-control.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("user:read")
  @ApiOperation({
    summary: "查询员工列表",
    description: "查询员工列表。"
  })
  @ApiOkResponse({
    type: UserVo,
    isArray: true
  })
  list(@CurrentUser() user: AuthUser) {
    return this.usersService.list(user);
  }

  @Post()
  @Permissions("user:write")
  @ApiOperation({
    summary: "创建员工",
    description: "创建员工。"
  })
  @ApiOkResponse({
    type: UserVo
  })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("user:write")
  @ApiOperation({
    summary: "更新员工",
    description: "更新员工。"
  })
  @ApiOkResponse({
    type: UserVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("user:write")
  @ApiOperation({
    summary: "启用员工",
    description: "启用员工。"
  })
  @ApiOkResponse({
    type: UserVo
  })
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.toggle(id, UserStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("user:write")
  @ApiOperation({
    summary: "停用员工",
    description: "停用员工。"
  })
  @ApiOkResponse({
    type: UserVo
  })
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.toggle(id, UserStatus.DISABLED, user);
  }

  @Patch(":id/unlock")
  @Permissions("user:write")
  @ApiOperation({
    summary: "解除员工永久锁定",
    description: "管理员解除员工的永久锁定状态。"
  })
  @ApiOkResponse({
    type: UserVo
  })
  unlock(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.unlock(id, user);
  }
}
