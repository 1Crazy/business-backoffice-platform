/** workflow 模块 DTO：负责约束流程模板配置接口的输入契约。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { WorkflowAssignmentType, WorkflowNodeType, WorkflowTemplateStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";

export class WorkflowBranchRuleDto {
  @ApiProperty({
    description: "参与分支判断的字段名。"
  })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({
    description: "分支判断操作符。",
    enum: ["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN"]
  })
  @IsString()
  @IsIn(["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN"])
  operator!: "EQ" | "NEQ" | "GT" | "GTE" | "LT" | "LTE" | "IN";

  @ApiProperty({
    description: "分支判断值。"
  })
  value!: unknown;

  @ApiProperty({
    description: "命中规则后跳转到的下一节点 key。"
  })
  @IsString()
  @IsNotEmpty()
  nextNodeKey!: string;
}

export class WorkflowTemplateNodeDto {
  @ApiProperty({
    description: "节点唯一 key。"
  })
  @IsString()
  @IsNotEmpty()
  nodeKey!: string;

  @ApiProperty({
    description: "节点名称。"
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: "节点类型。",
    enum: WorkflowNodeType,
    default: WorkflowNodeType.APPROVAL
  })
  @IsOptional()
  @IsEnum(WorkflowNodeType)
  nodeType?: WorkflowNodeType;

  @ApiProperty({
    description: "节点顺序，从 1 开始。"
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  position!: number;

  @ApiProperty({
    description: "审批人分配方式。",
    enum: WorkflowAssignmentType
  })
  @IsEnum(WorkflowAssignmentType)
  assignmentType!: WorkflowAssignmentType;

  @ApiProperty({
    description: "审批人分配配置，USER 模式传 userIds，PERMISSION 模式传 permissionCode。"
  })
  @IsObject()
  assignmentConfig!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "命中分支规则列表。",
    type: () => [WorkflowBranchRuleDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowBranchRuleDto)
  branchRules?: WorkflowBranchRuleDto[];

  @ApiPropertyOptional({
    description: "未命中任何条件时的兜底下一节点 key。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  fallbackNodeKey?: string | null;

  @ApiPropertyOptional({
    description: "当前节点是否允许加签。",
    default: true
  })
  @IsOptional()
  @IsBoolean()
  allowAddSign?: boolean;

  @ApiPropertyOptional({
    description: "当前节点是否允许转交。",
    default: true
  })
  @IsOptional()
  @IsBoolean()
  allowTransfer?: boolean;

  @ApiPropertyOptional({
    description: "当前节点自动抄送的员工 ID 列表。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccUserIds?: string[];
}

export class CreateWorkflowTemplateDto {
  @ApiProperty({
    description: "模板唯一 key。"
  })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: "模板名称。"
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: "模板说明。",
    nullable: true
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: "模板所属业务类型。"
  })
  @IsString()
  @IsNotEmpty()
  businessType!: string;

  @ApiProperty({
    description: "表单结构定义。"
  })
  @IsObject()
  formSchema!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "流程发起时自动抄送的员工 ID 列表。",
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultCcUserIds?: string[];

  @ApiPropertyOptional({
    description: "模板状态，默认保存为草稿。",
    enum: WorkflowTemplateStatus,
    default: WorkflowTemplateStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(WorkflowTemplateStatus)
  status?: WorkflowTemplateStatus;

  @ApiProperty({
    description: "模板节点定义。",
    type: () => [WorkflowTemplateNodeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowTemplateNodeDto)
  nodes!: WorkflowTemplateNodeDto[];
}
