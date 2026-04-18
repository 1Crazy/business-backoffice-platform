/** departments 模块控制器：负责路由声明、参数接收和权限边界，不直接处理持久化细节。 */
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { RecordStatus } from "@prisma/client";

import { DepartmentVo } from "@/common/vo/access-control.vo";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
import { DepartmentsService } from "./departments.service";

@ApiTags("departments")
@ApiBearerAuth()
@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Permissions("department:read")
  @ApiOperation({
    summary: "查询部门列表",
    description: "查询部门列表。"
  })
  @ApiOkResponse({
    type: DepartmentVo,
    isArray: true
  })
  list(@CurrentUser() user: AuthUser) {
    return this.departmentsService.list(user);
  }

  @Post()
  @Permissions("department:write")
  @ApiOperation({
    summary: "创建部门",
    description: "创建部门。"
  })
  @ApiOkResponse({
    type: DepartmentVo
  })
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.create(dto, user);
  }

  @Patch(":id")
  @Permissions("department:write")
  @ApiOperation({
    summary: "更新部门",
    description: "更新部门。"
  })
  @ApiOkResponse({
    type: DepartmentVo
  })
  update(@Param("id") id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() user: AuthUser) {
    return this.departmentsService.update(id, dto, user);
  }

  @Patch(":id/enable")
  @Permissions("department:write")
  @ApiOperation({
    summary: "启用部门",
    description: "启用部门。"
  })
  @ApiOkResponse({
    type: DepartmentVo
  })
  enable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.toggle(id, RecordStatus.ACTIVE, user);
  }

  @Patch(":id/disable")
  @Permissions("department:write")
  @ApiOperation({
    summary: "停用部门",
    description: "停用部门。"
  })
  @ApiOkResponse({
    type: DepartmentVo
  })
  disable(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.departmentsService.toggle(id, RecordStatus.DISABLED, user);
  }
}
