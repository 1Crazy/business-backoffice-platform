/** 共享 VO：负责多个业务模块复用的接口返回契约定义。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope, RecordStatus, UserStatus } from "@prisma/client";

export class DepartmentParentVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiProperty({
    description: "编码。"
  })
  code!: string;

  @ApiProperty({
    description: "部门状态。",
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiPropertyOptional({
    description: "上级部门 ID；为空时表示顶级部门。",
    nullable: true
  })
  parentId?: string | null;
}

export class DepartmentVo extends DepartmentParentVo {
  @ApiPropertyOptional({
    description: "上级部门摘要信息；顶级部门为空。",
    type: () => DepartmentParentVo,
    nullable: true
  })
  parent?: DepartmentParentVo | null;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}

export class PermissionVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "所属后台应用编码，例如 scrm 或 oa。"
  })
  appCode!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiProperty({
    description: "编码。"
  })
  code!: string;

  @ApiPropertyOptional({
    description: "权限说明。",
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "权限分组。"
  })
  group!: string;

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}

export class RolePermissionRelationVo {
  @ApiProperty({
    description: "权限详情。",
    type: () => PermissionVo
  })
  permission!: PermissionVo;
}

export class RoleVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "名称。"
  })
  name!: string;

  @ApiProperty({
    description: "编码。"
  })
  code!: string;

  @ApiPropertyOptional({
    description: "角色说明。",
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "是否为系统内置角色。"
  })
  isSystem!: boolean;

  @ApiProperty({
    description: "状态。",
enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiProperty({
    description: "数据范围。",
enum: DataScope
  })
  dataScope!: DataScope;

  @ApiProperty({
    description: "角色绑定的权限列表。",
    type: () => [RolePermissionRelationVo]
  })
  permissions!: RolePermissionRelationVo[];

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}

export class UserRoleRelationVo {
  @ApiProperty({
    description: "角色摘要信息。",
    type: () => RoleVo
  })
  role!: RoleVo;
}

export class UserSummaryVo {
  @ApiProperty({
    description: "记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "登录用户名。"
  })
  username!: string;

  @ApiProperty({
    description: "显示名称。"
  })
  displayName!: string;

  @ApiPropertyOptional({
    description: "电子邮箱。",
nullable: true
  })
  email?: string | null;

  @ApiPropertyOptional({
    description: "联系电话。",
nullable: true
  })
  phone?: string | null;

  @ApiProperty({
    description: "状态。",
enum: UserStatus
  })
  status!: UserStatus;

  @ApiPropertyOptional({
    description: "所属部门 ID；为空表示未绑定部门。",
    nullable: true
  })
  departmentId?: string | null;
}

export class UserVo extends UserSummaryVo {
  @ApiPropertyOptional({
    description: "所属部门摘要信息；为空表示未绑定部门。",
    type: () => DepartmentParentVo,
    nullable: true
  })
  department?: DepartmentParentVo | null;

  @ApiProperty({
    description: "当前用户绑定的角色列表。",
    type: () => [UserRoleRelationVo]
  })
  roles!: UserRoleRelationVo[];

  @ApiProperty({
    description: "创建时间。",
format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    description: "更新时间。",
format: "date-time"
  })
  updatedAt!: string;
}
