import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DataScope, RecordStatus, UserStatus } from "@prisma/client";

export class DepartmentParentVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiPropertyOptional({ nullable: true })
  parentId?: string | null;
}

export class DepartmentVo extends DepartmentParentVo {
  @ApiPropertyOptional({
    type: () => DepartmentParentVo,
    nullable: true
  })
  parent?: DepartmentParentVo | null;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class PermissionVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  group!: string;

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class RolePermissionRelationVo {
  @ApiProperty({
    type: () => PermissionVo
  })
  permission!: PermissionVo;
}

export class RoleVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiProperty()
  isSystem!: boolean;

  @ApiProperty({
    enum: RecordStatus
  })
  status!: RecordStatus;

  @ApiProperty({
    enum: DataScope
  })
  dataScope!: DataScope;

  @ApiProperty({
    type: () => [RolePermissionRelationVo]
  })
  permissions!: RolePermissionRelationVo[];

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}

export class UserRoleRelationVo {
  @ApiProperty({
    type: () => RoleVo
  })
  role!: RoleVo;
}

export class UserSummaryVo {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phone?: string | null;

  @ApiProperty({
    enum: UserStatus
  })
  status!: UserStatus;

  @ApiPropertyOptional({ nullable: true })
  departmentId?: string | null;
}

export class UserVo extends UserSummaryVo {
  @ApiPropertyOptional({
    type: () => DepartmentParentVo,
    nullable: true
  })
  department?: DepartmentParentVo | null;

  @ApiProperty({
    type: () => [UserRoleRelationVo]
  })
  roles!: UserRoleRelationVo[];

  @ApiProperty({
    format: "date-time"
  })
  createdAt!: string;

  @ApiProperty({
    format: "date-time"
  })
  updatedAt!: string;
}
