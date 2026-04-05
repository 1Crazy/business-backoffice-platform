import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { UserStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("user:read")
  list() {
    return this.usersService.list();
  }

  @Post()
  @Permissions("user:write")
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("user:write")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("user:write")
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.toggle(id, UserStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("user:write")
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.toggle(id, UserStatus.DISABLED, user);
  }
}

