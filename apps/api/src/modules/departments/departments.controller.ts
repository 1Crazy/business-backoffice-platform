import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RecordStatus } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { DepartmentsService } from "./departments.service";

@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions("department:read")
  list() {
    return this.departmentsService.list();
  }

  @Post()
  @Permissions("department:write")
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("department:write")
  update(@Param("id") id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("department:write")
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.toggle(id, RecordStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("department:write")
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.toggle(id, RecordStatus.DISABLED, user);
  }
}

