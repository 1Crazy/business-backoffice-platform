/** workflow 模块 VO：负责描述流程模板和运行时实例的接口返回结构。 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  WorkflowActionType,
  WorkflowAssignmentType,
  WorkflowInstanceStatus,
  WorkflowNodeType,
  WorkflowTaskStatus,
  WorkflowTemplateStatus
} from "@prisma/client";

class WorkflowUserSummaryVo {
  @ApiProperty({
    description: "流程相关员工 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "显示名称。"
  })
  displayName!: string;
}

export class WorkflowTemplateNodeVo {
  @ApiProperty({
    description: "节点 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "节点 key。"
  })
  nodeKey!: string;

  @ApiProperty({
    description: "节点名称。"
  })
  name!: string;

  @ApiProperty({
    description: "节点类型。",
    enum: WorkflowNodeType
  })
  nodeType!: WorkflowNodeType;

  @ApiProperty({
    description: "节点顺序。"
  })
  position!: number;

  @ApiProperty({
    description: "审批人分配方式。",
    enum: WorkflowAssignmentType
  })
  assignmentType!: WorkflowAssignmentType;

  @ApiProperty({
    description: "审批人分配配置。该字段为动态对象，具体键值取决于 assignmentType 与节点规则。"
  })
  assignmentConfig!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "分支配置。",
    nullable: true
  })
  branchRules?: unknown;

  @ApiPropertyOptional({
    description: "兜底下一节点 key。",
    nullable: true
  })
  fallbackNodeKey?: string | null;

  @ApiProperty({
    description: "是否允许加签。"
  })
  allowAddSign!: boolean;

  @ApiProperty({
    description: "是否允许转交。"
  })
  allowTransfer!: boolean;

  @ApiProperty({
    description: "当前节点自动抄送的员工 ID 列表。",
    type: [String]
  })
  ccUserIds!: string[];
}

export class WorkflowTemplateVo {
  @ApiProperty({
    description: "模板 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "模板唯一 key。"
  })
  key!: string;

  @ApiProperty({
    description: "模板名称。"
  })
  name!: string;

  @ApiPropertyOptional({
    description: "模板说明。",
    nullable: true
  })
  description?: string | null;

  @ApiProperty({
    description: "业务类型。"
  })
  businessType!: string;

  @ApiProperty({
    description: "模板版本。"
  })
  version!: number;

  @ApiProperty({
    description: "模板状态。",
    enum: WorkflowTemplateStatus
  })
  status!: WorkflowTemplateStatus;

  @ApiProperty({
    description: "表单结构定义。该字段为动态对象，返回流程模板约定的表单 schema。"
  })
  formSchema!: Record<string, unknown>;

  @ApiProperty({
    description: "流程默认抄送的员工 ID 列表。",
    type: [String]
  })
  defaultCcUserIds!: string[];

  @ApiProperty({
    description: "模板节点定义。",
    type: () => [WorkflowTemplateNodeVo]
  })
  nodes!: WorkflowTemplateNodeVo[];

  @ApiProperty({
    description: "创建人。",
    type: () => WorkflowUserSummaryVo
  })
  createdBy!: WorkflowUserSummaryVo;

  @ApiProperty({
    description: "最近更新人。",
    type: () => WorkflowUserSummaryVo
  })
  updatedBy!: WorkflowUserSummaryVo;

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

export class WorkflowTaskVo {
  @ApiProperty({
    description: "任务 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "节点 key。"
  })
  nodeKey!: string;

  @ApiProperty({
    description: "节点名称。"
  })
  nodeName!: string;

  @ApiProperty({
    description: "是否为加签任务。"
  })
  isAddSign!: boolean;

  @ApiProperty({
    description: "任务状态。",
    enum: WorkflowTaskStatus
  })
  status!: WorkflowTaskStatus;

  @ApiProperty({
    description: "处理人。",
    type: () => WorkflowUserSummaryVo
  })
  assignee!: WorkflowUserSummaryVo;

  @ApiPropertyOptional({
    description: "任务创建人。",
    type: () => WorkflowUserSummaryVo,
    nullable: true
  })
  createdBy?: WorkflowUserSummaryVo | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;

  @ApiPropertyOptional({
    description: "处理时间。",
    format: "date-time",
    nullable: true
  })
  decidedAt?: string | null;
}

export class WorkflowActionVo {
  @ApiProperty({
    description: "动作 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "动作类型。",
    enum: WorkflowActionType
  })
  actionType!: WorkflowActionType;

  @ApiProperty({
    description: "动作执行人。",
    type: () => WorkflowUserSummaryVo
  })
  actor!: WorkflowUserSummaryVo;

  @ApiPropertyOptional({
    description: "动作备注。",
    nullable: true
  })
  comment?: string | null;

  @ApiPropertyOptional({
    description: "动作扩展负载。",
    nullable: true
  })
  payload?: unknown;

  @ApiProperty({
    description: "动作时间。",
    format: "date-time"
  })
  createdAt!: string;
}

export class WorkflowCcRecipientVo {
  @ApiProperty({
    description: "流程抄送记录 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "抄送用户。",
    type: () => WorkflowUserSummaryVo
  })
  user!: WorkflowUserSummaryVo;

  @ApiProperty({
    description: "抄送创建人。",
    type: () => WorkflowUserSummaryVo
  })
  createdBy!: WorkflowUserSummaryVo;

  @ApiPropertyOptional({
    description: "抄送来源节点 key。",
    nullable: true
  })
  sourceNodeKey?: string | null;

  @ApiProperty({
    description: "创建时间。",
    format: "date-time"
  })
  createdAt!: string;
}

class WorkflowTemplateSummaryVo {
  @ApiProperty({
    description: "模板 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "模板 key。"
  })
  key!: string;

  @ApiProperty({
    description: "模板名称。"
  })
  name!: string;

  @ApiProperty({
    description: "模板版本。"
  })
  version!: number;
}

export class WorkflowInstanceVo {
  @ApiProperty({
    description: "流程实例 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "流程标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    description: "关联业务单据 ID 或外部业务键。",
    nullable: true
  })
  businessKey?: string | null;

  @ApiProperty({
    description: "实例状态。",
    enum: WorkflowInstanceStatus
  })
  status!: WorkflowInstanceStatus;

  @ApiPropertyOptional({
    description: "当前节点 key。",
    nullable: true
  })
  currentNodeKey?: string | null;

  @ApiProperty({
    description: "流程模板摘要。",
    type: () => WorkflowTemplateSummaryVo
  })
  template!: WorkflowTemplateSummaryVo;

  @ApiProperty({
    description: "申请人。",
    type: () => WorkflowUserSummaryVo
  })
  applicant!: WorkflowUserSummaryVo;

  @ApiProperty({
    description: "表单数据。该字段为动态对象，实际字段由流程模板定义。"
  })
  formData!: Record<string, unknown>;

  @ApiProperty({
    description: "待办节点任务。",
    type: () => [WorkflowTaskVo]
  })
  tasks!: WorkflowTaskVo[];

  @ApiProperty({
    description: "动作轨迹。",
    type: () => [WorkflowActionVo]
  })
  actions!: WorkflowActionVo[];

  @ApiProperty({
    description: "抄送列表。",
    type: () => [WorkflowCcRecipientVo]
  })
  ccRecipients!: WorkflowCcRecipientVo[];

  @ApiProperty({
    description: "提交流程时间。",
    format: "date-time"
  })
  submittedAt!: string;

  @ApiPropertyOptional({
    description: "完成时间。",
    format: "date-time",
    nullable: true
  })
  completedAt?: string | null;

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

export class WorkflowPendingTaskVo {
  @ApiProperty({
    description: "待办任务 ID。"
  })
  id!: string;

  @ApiProperty({
    description: "流程实例 ID。"
  })
  instanceId!: string;

  @ApiProperty({
    description: "当前节点 key。"
  })
  nodeKey!: string;

  @ApiProperty({
    description: "当前节点名称。"
  })
  nodeName!: string;

  @ApiProperty({
    description: "流程标题。"
  })
  title!: string;

  @ApiPropertyOptional({
    description: "关联业务单据 ID 或外部业务键。",
    nullable: true
  })
  businessKey?: string | null;

  @ApiProperty({
    description: "流程状态。",
    enum: WorkflowInstanceStatus
  })
  status!: WorkflowInstanceStatus;

  @ApiProperty({
    description: "流程模板摘要。",
    type: () => WorkflowTemplateSummaryVo
  })
  template!: WorkflowTemplateSummaryVo;

  @ApiProperty({
    description: "申请人。",
    type: () => WorkflowUserSummaryVo
  })
  applicant!: WorkflowUserSummaryVo;

  @ApiProperty({
    description: "流程表单数据。该字段为动态对象，实际字段由流程模板定义。"
  })
  formData!: Record<string, unknown>;

  @ApiProperty({
    description: "提交流程时间。",
    format: "date-time"
  })
  submittedAt!: string;
}
