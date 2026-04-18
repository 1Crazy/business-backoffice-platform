import {
  AdministrativeRequestActionType,
  AdministrativeRequestStatus,
  AdministrativeRequestType,
  ApprovalActionDecision,
  ContractStatus,
  DataScope,
  LeaveRequestStatus,
  OpportunityStage,
  PaymentPlanStatus,
  PrismaClient,
  QuoteStatus,
  RecordStatus,
  RenewalReminderStatus,
  UserStatus
  ,
  WorkflowAssignmentType,
  WorkflowNodeType,
  WorkflowTemplateStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEFAULT_TENANT_CODE = "default";
const DEFAULT_TENANT_NAME = "默认租户";

const permissionSeeds = [
  ["scrm", "dashboard:view", "查看看板", "dashboard"],
  ["platform", "department:read", "查看部门", "access"],
  ["platform", "department:write", "编辑部门", "access"],
  ["platform", "user:read", "查看员工", "access"],
  ["platform", "user:write", "编辑员工", "access"],
  ["platform", "role:read", "查看角色", "access"],
  ["platform", "role:write", "编辑角色", "access"],
  ["platform", "tenant:read", "查看租户运营", "tenant"],
  ["platform", "tenant:write", "编辑租户运营", "tenant"],
  ["platform", "product-config:read", "查看产品配置", "configuration"],
  ["platform", "product-config:write", "编辑产品配置", "configuration"],
  ["platform", "system-governance:read", "查看系统治理", "governance"],
  ["platform", "system-governance:write", "编辑系统治理", "governance"],
  ["scrm", "customer:read", "查看客户", "customer"],
  ["scrm", "customer:write", "编辑客户", "customer"],
  ["scrm", "customer:assign", "转交客户", "customer"],
  ["scrm", "opportunity:read", "查看商机", "opportunity"],
  ["scrm", "opportunity:write", "编辑商机", "opportunity"],
  ["scrm", "opportunity:assign", "分配商机", "opportunity"],
  ["scrm", "lead:read", "查看线索", "lead"],
  ["scrm", "lead:write", "编辑线索", "lead"],
  ["scrm", "lead:assign", "分配线索", "lead"],
  ["scrm", "lead:convert", "转换线索", "lead"],
  ["scrm", "followup:write", "记录跟进", "lead"],
  ["scrm", "dictionary:read", "查看字典", "system"],
  ["scrm", "dictionary:write", "编辑字典", "system"],
  ["scrm", "audit-log:read", "查看审计日志", "system"],
  ["scrm", "upload:write", "上传附件", "system"],
  ["oa", "oa:workspace:view", "查看 OA 工作台", "workspace"],
  ["oa", "oa:approval:read", "查看审批中心", "approval"],
  ["oa", "oa:approval:write", "处理审批", "approval"],
  ["oa", "oa:workflow-template:read", "查看流程模板", "workflow"],
  ["oa", "oa:workflow-template:write", "配置流程模板", "workflow"],
  ["oa", "oa:workflow:read", "查看流程实例", "workflow"],
  ["oa", "oa:workflow:apply", "发起流程实例", "workflow"],
  ["oa", "oa:workflow:write", "处理流程实例", "workflow"],
  ["oa", "oa:request:apply", "提交行政申请", "request"],
  ["oa", "oa:request:approve", "审批行政申请", "request"],
  ["oa", "oa:request:read", "检索行政申请", "request"],
  ["oa", "oa:leave:apply", "提交请假申请", "leave"],
  ["oa", "oa:announcement:read", "查看公告通知", "announcement"],
  ["oa", "oa:directory:read", "查看组织通讯录", "directory"]
] as const;

const workflowTemplateSeeds = [
  {
    key: "LEAVE",
    name: "请假申请",
    businessType: "LEAVE",
    formSchema: {
      fields: ["leaveType", "startAt", "endAt", "reason"]
    },
    nodes: [
      {
        nodeKey: "leave-approval",
        name: "请假审批",
        nodeType: WorkflowNodeType.APPROVAL,
        position: 1,
        assignmentType: WorkflowAssignmentType.PERMISSION,
        assignmentConfig: {
          permissionCode: "oa:approval:write"
        },
        allowAddSign: true,
        allowTransfer: true
      }
    ]
  },
  {
    key: "REIMBURSEMENT",
    name: "报销申请",
    businessType: "REIMBURSEMENT",
    formSchema: {
      fields: ["title", "reason", "expenseDate", "expenseCategory", "amount", "payeeName", "attachmentNames"]
    },
    nodes: [
      {
        nodeKey: "reimbursement-approval",
        name: "报销审批",
        nodeType: WorkflowNodeType.APPROVAL,
        position: 1,
        assignmentType: WorkflowAssignmentType.PERMISSION,
        assignmentConfig: {
          permissionCode: "oa:request:approve"
        },
        allowAddSign: true,
        allowTransfer: true
      }
    ]
  },
  {
    key: "TRAVEL",
    name: "出差申请",
    businessType: "TRAVEL",
    formSchema: {
      fields: ["title", "reason", "startAt", "endAt", "destination", "transportation", "estimatedAmount", "attachmentNames"]
    },
    nodes: [
      {
        nodeKey: "travel-approval",
        name: "出差审批",
        nodeType: WorkflowNodeType.APPROVAL,
        position: 1,
        assignmentType: WorkflowAssignmentType.PERMISSION,
        assignmentConfig: {
          permissionCode: "oa:request:approve"
        },
        allowAddSign: true,
        allowTransfer: true
      }
    ]
  },
  {
    key: "PURCHASE",
    name: "采购申请",
    businessType: "PURCHASE",
    formSchema: {
      fields: ["title", "reason", "itemName", "quantity", "budgetAmount", "neededBy", "attachmentNames"]
    },
    nodes: [
      {
        nodeKey: "purchase-approval",
        name: "采购审批",
        nodeType: WorkflowNodeType.APPROVAL,
        position: 1,
        assignmentType: WorkflowAssignmentType.PERMISSION,
        assignmentConfig: {
          permissionCode: "oa:request:approve"
        },
        allowAddSign: true,
        allowTransfer: true
      }
    ]
  },
  {
    key: "SEAL",
    name: "用印申请",
    businessType: "SEAL",
    formSchema: {
      fields: ["title", "reason", "documentName", "sealType", "useDate", "copyCount", "attachmentNames"]
    },
    nodes: [
      {
        nodeKey: "seal-approval",
        name: "用印审批",
        nodeType: WorkflowNodeType.APPROVAL,
        position: 1,
        assignmentType: WorkflowAssignmentType.PERMISSION,
        assignmentConfig: {
          permissionCode: "oa:request:approve"
        },
        allowAddSign: true,
        allowTransfer: true
      }
    ]
  }
] as const;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Admin123456!", 10);
  const defaultTenant = await prisma.tenant.upsert({
    where: {
      code: DEFAULT_TENANT_CODE
    },
    update: {
      name: DEFAULT_TENANT_NAME,
      status: RecordStatus.ACTIVE,
      isDefault: true,
      planName: "平台默认版",
      ownerName: "平台运营",
      ownerEmail: "platform@example.com",
      initializedAt: new Date(),
      disabledAt: null,
      archivedAt: null,
      userQuota: 500,
      storageQuotaMb: 20480,
      monthlyTaskQuota: 50000
    },
    create: {
      code: DEFAULT_TENANT_CODE,
      name: DEFAULT_TENANT_NAME,
      status: RecordStatus.ACTIVE,
      isDefault: true,
      planName: "平台默认版",
      ownerName: "平台运营",
      ownerEmail: "platform@example.com",
      initializedAt: new Date(),
      userQuota: 500,
      storageQuotaMb: 20480,
      monthlyTaskQuota: 50000
    }
  });

  const defaultDepartment = await prisma.department.upsert({
    where: { code: "HQ" },
    update: {
      tenantId: defaultTenant.id
    },
    create: {
      tenantId: defaultTenant.id,
      name: "总部",
      code: "HQ"
    }
  });

  const operationsDepartment = await prisma.department.upsert({
    where: { code: "OPS" },
    update: {
      tenantId: defaultTenant.id,
      name: "运营中心",
      status: RecordStatus.ACTIVE
    },
    create: {
      tenantId: defaultTenant.id,
      name: "运营中心",
      code: "OPS"
    }
  });

  const permissions = await Promise.all(
    permissionSeeds.map(([appCode, code, name, group]) =>
      prisma.permission.upsert({
        where: { code },
        update: { appCode, name, group },
        create: { appCode, code, name, group }
      })
    )
  );

  const allPermissionIds = permissions.map((item) => item.id);

  const superAdminRole = await prisma.role.upsert({
    where: { code: "super-admin" },
    update: {
      tenantId: defaultTenant.id,
      name: "超级管理员",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.ALL
    },
    create: {
      tenantId: defaultTenant.id,
      name: "超级管理员",
      code: "super-admin",
      isSystem: true,
      dataScope: DataScope.ALL
    }
  });

  const salesManagerRole = await prisma.role.upsert({
    where: { code: "sales-manager" },
    update: {
      tenantId: defaultTenant.id,
      name: "销售主管",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.DEPARTMENT
    },
    create: {
      tenantId: defaultTenant.id,
      name: "销售主管",
      code: "sales-manager",
      isSystem: true,
      dataScope: DataScope.DEPARTMENT
    }
  });

  const salesMemberRole = await prisma.role.upsert({
    where: { code: "sales-member" },
    update: {
      tenantId: defaultTenant.id,
      name: "销售成员",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.SELF
    },
    create: {
      tenantId: defaultTenant.id,
      name: "销售成员",
      code: "sales-member",
      isSystem: true,
      dataScope: DataScope.SELF
    }
  });

  const oaMemberRole = await prisma.role.upsert({
    where: { code: "oa-member" },
    update: {
      tenantId: defaultTenant.id,
      name: "OA 普通员工",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.SELF
    },
    create: {
      tenantId: defaultTenant.id,
      name: "OA 普通员工",
      code: "oa-member",
      isSystem: true,
      dataScope: DataScope.SELF
    }
  });

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: {
        in: [superAdminRole.id, salesManagerRole.id, salesMemberRole.id, oaMemberRole.id]
      }
    }
  });

  await prisma.rolePermission.createMany({
    data: allPermissionIds.map((permissionId) => ({
      roleId: superAdminRole.id,
      permissionId
    })),
    skipDuplicates: true
  });

  const managerPermissions = permissions
    .filter((item) =>
      [
        "dashboard:view",
        "customer:read",
        "customer:write",
        "customer:assign",
        "opportunity:read",
        "opportunity:write",
        "opportunity:assign",
        "lead:read",
        "lead:write",
        "lead:assign",
        "lead:convert",
        "followup:write",
        "dictionary:read",
        "audit-log:read",
        "upload:write"
      ].includes(item.code)
    )
    .map((item) => item.id);

  await prisma.rolePermission.createMany({
    data: managerPermissions.map((permissionId) => ({
      roleId: salesManagerRole.id,
      permissionId
    })),
    skipDuplicates: true
  });

  const memberPermissions = permissions
    .filter((item) =>
      [
        "dashboard:view",
        "customer:read",
        "customer:write",
        "opportunity:read",
        "opportunity:write",
        "lead:read",
        "lead:write",
        "lead:convert",
        "followup:write",
        "dictionary:read",
        "upload:write"
      ].includes(item.code)
    )
    .map((item) => item.id);

  await prisma.rolePermission.createMany({
    data: memberPermissions.map((permissionId) => ({
      roleId: salesMemberRole.id,
      permissionId
    })),
    skipDuplicates: true
  });

  const oaMemberPermissions = permissions
    .filter((item) =>
      [
        "oa:workspace:view",
        "oa:approval:read",
        "oa:workflow:read",
        "oa:workflow:apply",
        "oa:request:apply",
        "oa:leave:apply",
        "oa:announcement:read",
        "oa:directory:read"
      ].includes(item.code)
    )
    .map((item) => item.id);

  await prisma.rolePermission.createMany({
    data: oaMemberPermissions.map((permissionId) => ({
      roleId: oaMemberRole.id,
      permissionId
    })),
    skipDuplicates: true
  });

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      tenantId: defaultTenant.id,
      displayName: "系统管理员",
      passwordHash,
      departmentId: defaultDepartment.id,
      status: UserStatus.ACTIVE
    },
    create: {
      tenantId: defaultTenant.id,
      username: "admin",
      displayName: "系统管理员",
      passwordHash,
      departmentId: defaultDepartment.id
    }
  });

  const staffUser = await prisma.user.upsert({
    where: { username: "kyle" },
    update: {
      tenantId: defaultTenant.id,
      displayName: "kyle",
      passwordHash,
      departmentId: operationsDepartment.id,
      email: "wangyuhong7777@163.com",
      phone: "13800000002",
      status: UserStatus.ACTIVE
    },
    create: {
      tenantId: defaultTenant.id,
      username: "kyle",
      displayName: "kyle",
      passwordHash,
      departmentId: operationsDepartment.id,
      email: "wangyuhong7777@163.com",
      phone: "13800000002"
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: staffUser.id,
        roleId: oaMemberRole.id
      }
    },
    update: {},
    create: {
      userId: staffUser.id,
      roleId: oaMemberRole.id
    }
  });

  for (const templateSeed of workflowTemplateSeeds) {
    const template = await prisma.workflowTemplate.upsert({
      where: {
        key: templateSeed.key
      },
      update: {
        tenantId: defaultTenant.id,
        name: templateSeed.name,
        businessType: templateSeed.businessType,
        status: WorkflowTemplateStatus.ACTIVE,
        formSchema: templateSeed.formSchema,
        defaultCcUserIds: [],
        updatedById: adminUser.id
      },
      create: {
        tenantId: defaultTenant.id,
        key: templateSeed.key,
        name: templateSeed.name,
        businessType: templateSeed.businessType,
        status: WorkflowTemplateStatus.ACTIVE,
        formSchema: templateSeed.formSchema,
        defaultCcUserIds: [],
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    });

    await prisma.workflowTemplateNode.deleteMany({
      where: {
        templateId: template.id
      }
    });

    await prisma.workflowTemplateNode.createMany({
      data: templateSeed.nodes.map((node) => ({
        tenantId: defaultTenant.id,
        templateId: template.id,
        nodeKey: node.nodeKey,
        name: node.name,
        nodeType: node.nodeType,
        position: node.position,
        assignmentType: node.assignmentType,
        assignmentConfig: node.assignmentConfig,
        allowAddSign: node.allowAddSign,
        allowTransfer: node.allowTransfer
      }))
    });
  }

  await prisma.customer.upsert({
    where: { id: "scrm-customer-acme" },
    update: {
      tenantId: defaultTenant.id,
      name: "Acme 科技",
      contactName: "王经理",
      phone: "13900000001",
      email: "contact@acme.example",
      source: "website",
      status: "active",
      notes: "年度框架合作客户。",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-customer-acme",
      tenantId: defaultTenant.id,
      name: "Acme 科技",
      contactName: "王经理",
      phone: "13900000001",
      email: "contact@acme.example",
      source: "website",
      status: "active",
      notes: "年度框架合作客户。",
      ownerId: adminUser.id
    }
  });

  await prisma.lead.upsert({
    where: { id: "scrm-lead-acme-referral" },
    update: {
      tenantId: defaultTenant.id,
      name: "Acme 年度合作线索",
      contactName: "王经理",
      phone: "13900000001",
      source: "campaign",
      status: "CONVERTED",
      notes: "已转客户并进入成交后经营阶段。",
      ownerId: adminUser.id,
      convertedCustomerId: "scrm-customer-acme"
    },
    create: {
      id: "scrm-lead-acme-referral",
      tenantId: defaultTenant.id,
      name: "Acme 年度合作线索",
      contactName: "王经理",
      phone: "13900000001",
      source: "campaign",
      status: "CONVERTED",
      notes: "已转客户并进入成交后经营阶段。",
      ownerId: adminUser.id,
      convertedCustomerId: "scrm-customer-acme"
    }
  });

  await prisma.opportunity.upsert({
    where: { id: "scrm-opportunity-acme-framework" },
    update: {
      tenantId: defaultTenant.id,
      name: "Acme 年度框架合作",
      customerId: "scrm-customer-acme",
      sourceLeadId: "scrm-lead-acme-referral",
      ownerId: adminUser.id,
      stage: OpportunityStage.CLOSED_WON,
      expectedAmount: 320000,
      expectedCloseDate: new Date("2026-04-30T10:00:00+08:00"),
      nextAction: "推进年度交付与回款节点执行",
      notes: "已赢单，进入合同履约与回款阶段。",
      closedAt: new Date("2026-04-12T15:00:00+08:00"),
      lostReason: null
    },
    create: {
      id: "scrm-opportunity-acme-framework",
      tenantId: defaultTenant.id,
      name: "Acme 年度框架合作",
      customerId: "scrm-customer-acme",
      sourceLeadId: "scrm-lead-acme-referral",
      ownerId: adminUser.id,
      stage: OpportunityStage.CLOSED_WON,
      expectedAmount: 320000,
      expectedCloseDate: new Date("2026-04-30T10:00:00+08:00"),
      nextAction: "推进年度交付与回款节点执行",
      notes: "已赢单，进入合同履约与回款阶段。",
      closedAt: new Date("2026-04-12T15:00:00+08:00")
    }
  });

  await prisma.opportunityStageHistory.deleteMany({
    where: {
      opportunityId: "scrm-opportunity-acme-framework"
    }
  });

  await prisma.opportunityStageHistory.createMany({
    data: [
      {
        id: "scrm-opportunity-stage-acme-create",
        tenantId: defaultTenant.id,
        opportunityId: "scrm-opportunity-acme-framework",
        fromStage: null,
        toStage: OpportunityStage.DISCOVERY,
        comment: "商机创建",
        createdById: adminUser.id,
        createdAt: new Date("2026-04-01T10:00:00+08:00")
      },
      {
        id: "scrm-opportunity-stage-acme-proposal",
        tenantId: defaultTenant.id,
        opportunityId: "scrm-opportunity-acme-framework",
        fromStage: OpportunityStage.QUALIFICATION,
        toStage: OpportunityStage.PROPOSAL,
        comment: "完成年度报价方案。",
        createdById: adminUser.id,
        createdAt: new Date("2026-04-05T14:00:00+08:00")
      },
      {
        id: "scrm-opportunity-stage-acme-win",
        tenantId: defaultTenant.id,
        opportunityId: "scrm-opportunity-acme-framework",
        fromStage: OpportunityStage.NEGOTIATION,
        toStage: OpportunityStage.CLOSED_WON,
        comment: "客户确认年度框架合作。",
        createdById: adminUser.id,
        createdAt: new Date("2026-04-12T15:00:00+08:00")
      }
    ],
    skipDuplicates: true
  });

  await prisma.quote.upsert({
    where: { id: "scrm-quote-acme-annual" },
    update: {
      tenantId: defaultTenant.id,
      quoteNo: "Q-202604-ACME-001",
      title: "Acme 年度解决方案报价",
      amount: 320000,
      status: QuoteStatus.ACCEPTED,
      issuedAt: new Date("2026-04-06T10:00:00+08:00"),
      expiresAt: new Date("2026-04-20T23:59:59+08:00"),
      notes: "年度 SaaS 授权与实施服务。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-quote-acme-annual",
      tenantId: defaultTenant.id,
      quoteNo: "Q-202604-ACME-001",
      title: "Acme 年度解决方案报价",
      amount: 320000,
      status: QuoteStatus.ACCEPTED,
      issuedAt: new Date("2026-04-06T10:00:00+08:00"),
      expiresAt: new Date("2026-04-20T23:59:59+08:00"),
      notes: "年度 SaaS 授权与实施服务。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      ownerId: adminUser.id
    }
  });

  await prisma.contract.upsert({
    where: { id: "scrm-contract-acme-annual" },
    update: {
      tenantId: defaultTenant.id,
      contractNo: "C-202604-ACME-001",
      title: "Acme 年度框架合同",
      amount: 320000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2026-04-15T00:00:00+08:00"),
      endDate: new Date("2027-04-14T23:59:59+08:00"),
      signedAt: new Date("2026-04-14T16:00:00+08:00"),
      notes: "年度合同，分两期回款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-contract-acme-annual",
      tenantId: defaultTenant.id,
      contractNo: "C-202604-ACME-001",
      title: "Acme 年度框架合同",
      amount: 320000,
      status: ContractStatus.ACTIVE,
      startDate: new Date("2026-04-15T00:00:00+08:00"),
      endDate: new Date("2027-04-14T23:59:59+08:00"),
      signedAt: new Date("2026-04-14T16:00:00+08:00"),
      notes: "年度合同，分两期回款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      ownerId: adminUser.id
    }
  });

  await prisma.paymentPlan.upsert({
    where: { id: "scrm-payment-plan-acme-initial" },
    update: {
      tenantId: defaultTenant.id,
      title: "首期预付款",
      plannedAmount: 160000,
      receivedAmount: 80000,
      plannedDate: new Date("2026-04-20T00:00:00+08:00"),
      status: PaymentPlanStatus.PARTIAL,
      notes: "签约后 5 个工作日内支付。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-payment-plan-acme-initial",
      tenantId: defaultTenant.id,
      title: "首期预付款",
      plannedAmount: 160000,
      receivedAmount: 80000,
      plannedDate: new Date("2026-04-20T00:00:00+08:00"),
      status: PaymentPlanStatus.PARTIAL,
      notes: "签约后 5 个工作日内支付。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    }
  });

  await prisma.paymentPlan.upsert({
    where: { id: "scrm-payment-plan-acme-final" },
    update: {
      tenantId: defaultTenant.id,
      title: "尾款回收",
      plannedAmount: 160000,
      receivedAmount: 0,
      plannedDate: new Date("2026-10-15T00:00:00+08:00"),
      status: PaymentPlanStatus.PENDING,
      notes: "验收后支付尾款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-payment-plan-acme-final",
      tenantId: defaultTenant.id,
      title: "尾款回收",
      plannedAmount: 160000,
      receivedAmount: 0,
      plannedDate: new Date("2026-10-15T00:00:00+08:00"),
      status: PaymentPlanStatus.PENDING,
      notes: "验收后支付尾款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    }
  });

  await prisma.paymentRecord.upsert({
    where: { id: "scrm-payment-record-acme-first" },
    update: {
      tenantId: defaultTenant.id,
      amount: 80000,
      receivedAt: new Date("2026-04-22T11:30:00+08:00"),
      note: "客户已支付首笔预付款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      paymentPlanId: "scrm-payment-plan-acme-initial",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-payment-record-acme-first",
      tenantId: defaultTenant.id,
      amount: 80000,
      receivedAt: new Date("2026-04-22T11:30:00+08:00"),
      note: "客户已支付首笔预付款。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      paymentPlanId: "scrm-payment-plan-acme-initial",
      ownerId: adminUser.id
    }
  });

  await prisma.renewalReminder.upsert({
    where: { id: "scrm-renewal-reminder-acme-annual" },
    update: {
      tenantId: defaultTenant.id,
      title: "Acme 年度框架合同续费跟进",
      remindAt: new Date("2027-02-15T09:00:00+08:00"),
      status: RenewalReminderStatus.PENDING,
      note: "提前两个月启动续费评估。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    },
    create: {
      id: "scrm-renewal-reminder-acme-annual",
      tenantId: defaultTenant.id,
      title: "Acme 年度框架合同续费跟进",
      remindAt: new Date("2027-02-15T09:00:00+08:00"),
      status: RenewalReminderStatus.PENDING,
      note: "提前两个月启动续费评估。",
      customerId: "scrm-customer-acme",
      opportunityId: "scrm-opportunity-acme-framework",
      contractId: "scrm-contract-acme-annual",
      ownerId: adminUser.id
    }
  });

  await prisma.dictionaryEntry.createMany({
    data: [
      { tenantId: defaultTenant.id, type: "customer-source", label: "官网表单", value: "website", sort: 1 },
      { tenantId: defaultTenant.id, type: "customer-source", label: "活动获客", value: "campaign", sort: 2 },
      { tenantId: defaultTenant.id, type: "customer-status", label: "新客户", value: "new", sort: 1 },
      { tenantId: defaultTenant.id, type: "customer-status", label: "跟进中", value: "active", sort: 2 }
    ],
    skipDuplicates: true
  });

  await prisma.announcement.upsert({
    where: { id: "oa-announcement-holiday" },
    update: {
      tenantId: defaultTenant.id,
      title: "清明节假期值班安排",
      summary: "请在 4 月 7 日前确认各组值班表与应急联系人。",
      content:
        "请各部门在本周内完成清明节假期值班排班，并同步应急联系人名单。涉及客户响应的一线同事请在节前完成交接说明。",
      status: RecordStatus.ACTIVE,
      publishedById: adminUser.id,
      publishedAt: new Date("2026-04-03T09:00:00+08:00")
    },
    create: {
      id: "oa-announcement-holiday",
      tenantId: defaultTenant.id,
      title: "清明节假期值班安排",
      summary: "请在 4 月 7 日前确认各组值班表与应急联系人。",
      content:
        "请各部门在本周内完成清明节假期值班排班，并同步应急联系人名单。涉及客户响应的一线同事请在节前完成交接说明。",
      status: RecordStatus.ACTIVE,
      publishedById: adminUser.id,
      publishedAt: new Date("2026-04-03T09:00:00+08:00")
    }
  });

  await prisma.announcement.upsert({
    where: { id: "oa-announcement-upgrade" },
    update: {
      tenantId: defaultTenant.id,
      title: "OA 试运行说明",
      summary: "首期开放工作台、请假审批、公告和通讯录四块能力。",
      content:
        "本周起 OA 前端进入试运行，首期先开放工作台、请假审批、公告通知和组织通讯录。后续如需扩展报销或出差流程，将基于当前固定业务流逐步演进。",
      status: RecordStatus.ACTIVE,
      publishedById: adminUser.id,
      publishedAt: new Date("2026-04-05T10:30:00+08:00")
    },
    create: {
      id: "oa-announcement-upgrade",
      tenantId: defaultTenant.id,
      title: "OA 试运行说明",
      summary: "首期开放工作台、请假审批、公告和通讯录四块能力。",
      content:
        "本周起 OA 前端进入试运行，首期先开放工作台、请假审批、公告通知和组织通讯录。后续如需扩展报销或出差流程，将基于当前固定业务流逐步演进。",
      status: RecordStatus.ACTIVE,
      publishedById: adminUser.id,
      publishedAt: new Date("2026-04-05T10:30:00+08:00")
    }
  });

  const leaveRequestIds = [
    "oa-leave-request-admin-pending",
    "oa-leave-request-admin-approved",
    "oa-leave-request-staff-pending"
  ];

  await prisma.leaveApprovalAction.deleteMany({
    where: {
      leaveRequestId: {
        in: leaveRequestIds
      }
    }
  });

  await prisma.leaveRequest.upsert({
    where: { id: "oa-leave-request-admin-pending" },
    update: {
      tenantId: defaultTenant.id,
      applicantId: adminUser.id,
      approverId: adminUser.id,
      leaveType: "ANNUAL",
      startAt: new Date("2026-04-09T09:00:00+08:00"),
      endAt: new Date("2026-04-10T18:00:00+08:00"),
      reason: "处理家庭事务与陪同就医。",
      status: LeaveRequestStatus.PENDING
    },
    create: {
      id: "oa-leave-request-admin-pending",
      tenantId: defaultTenant.id,
      applicantId: adminUser.id,
      approverId: adminUser.id,
      leaveType: "ANNUAL",
      startAt: new Date("2026-04-09T09:00:00+08:00"),
      endAt: new Date("2026-04-10T18:00:00+08:00"),
      reason: "处理家庭事务与陪同就医。",
      status: LeaveRequestStatus.PENDING
    }
  });

  await prisma.leaveRequest.upsert({
    where: { id: "oa-leave-request-admin-approved" },
    update: {
      applicantId: adminUser.id,
      approverId: adminUser.id,
      leaveType: "SICK",
      startAt: new Date("2026-04-01T09:30:00+08:00"),
      endAt: new Date("2026-04-01T18:00:00+08:00"),
      reason: "复诊检查与休息恢复。",
      status: LeaveRequestStatus.APPROVED
    },
    create: {
      id: "oa-leave-request-admin-approved",
      applicantId: adminUser.id,
      approverId: adminUser.id,
      leaveType: "SICK",
      startAt: new Date("2026-04-01T09:30:00+08:00"),
      endAt: new Date("2026-04-01T18:00:00+08:00"),
      reason: "复诊检查与休息恢复。",
      status: LeaveRequestStatus.APPROVED
    }
  });

  await prisma.leaveRequest.upsert({
    where: { id: "oa-leave-request-staff-pending" },
    update: {
      applicantId: staffUser.id,
      approverId: adminUser.id,
      leaveType: "PERSONAL",
      startAt: new Date("2026-04-08T13:00:00+08:00"),
      endAt: new Date("2026-04-08T18:00:00+08:00"),
      reason: "办理个人证件业务，需要半天外出。",
      status: LeaveRequestStatus.PENDING
    },
    create: {
      id: "oa-leave-request-staff-pending",
      applicantId: staffUser.id,
      approverId: adminUser.id,
      leaveType: "PERSONAL",
      startAt: new Date("2026-04-08T13:00:00+08:00"),
      endAt: new Date("2026-04-08T18:00:00+08:00"),
      reason: "办理个人证件业务，需要半天外出。",
      status: LeaveRequestStatus.PENDING
    }
  });

  await prisma.leaveApprovalAction.upsert({
    where: { id: "oa-leave-action-admin-approved" },
    update: {
      leaveRequestId: "oa-leave-request-admin-approved",
      actorId: adminUser.id,
      decision: ApprovalActionDecision.APPROVED,
      comment: "已阅，注意同步交接安排。"
    },
    create: {
      id: "oa-leave-action-admin-approved",
      leaveRequestId: "oa-leave-request-admin-approved",
      actorId: adminUser.id,
      decision: ApprovalActionDecision.APPROVED,
      comment: "已阅，注意同步交接安排。"
    }
  });

  const administrativeRequestIds = [
    "oa-admin-request-reimbursement",
    "oa-admin-request-travel",
    "oa-admin-request-purchase",
    "oa-admin-request-seal"
  ];

  await prisma.administrativeRequestAction.deleteMany({
    where: {
      requestId: {
        in: administrativeRequestIds
      }
    }
  });

  await prisma.administrativeRequest.upsert({
    where: {
      id: "oa-admin-request-reimbursement"
    },
    update: {
      requestNo: "AR-REI-20260409-DEMO01",
      type: AdministrativeRequestType.REIMBURSEMENT,
      title: "华东客户差旅报销",
      summary: "差旅交通 / kyle / 1280.50",
      reason: "补充 4 月初客户拜访期间的交通与住宿报销。",
      formData: {
        expenseDate: "2026-04-06 00:00:00",
        expenseCategory: "差旅交通",
        payeeName: "kyle",
        amount: 1280.5
      },
      attachmentNames: ["行程单.pdf", "酒店发票.jpg"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.PENDING,
      submittedAt: new Date("2026-04-09T10:20:00+08:00"),
      decidedAt: null
    },
    create: {
      id: "oa-admin-request-reimbursement",
      requestNo: "AR-REI-20260409-DEMO01",
      type: AdministrativeRequestType.REIMBURSEMENT,
      title: "华东客户差旅报销",
      summary: "差旅交通 / kyle / 1280.50",
      reason: "补充 4 月初客户拜访期间的交通与住宿报销。",
      formData: {
        expenseDate: "2026-04-06 00:00:00",
        expenseCategory: "差旅交通",
        payeeName: "kyle",
        amount: 1280.5
      },
      attachmentNames: ["行程单.pdf", "酒店发票.jpg"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.PENDING,
      submittedAt: new Date("2026-04-09T10:20:00+08:00")
    }
  });

  await prisma.administrativeRequest.upsert({
    where: {
      id: "oa-admin-request-travel"
    },
    update: {
      requestNo: "AR-TRA-20260408-DEMO02",
      type: AdministrativeRequestType.TRAVEL,
      title: "上海客户现场出差申请",
      summary: "上海 / 2026-04-15 09:00:00 至 2026-04-16 18:00:00 / 高铁",
      reason: "前往客户现场完成需求澄清和项目启动。",
      formData: {
        startAt: "2026-04-15T09:00:00.000Z",
        endAt: "2026-04-16T18:00:00.000Z",
        destination: "上海",
        transportation: "高铁",
        estimatedAmount: 1800
      },
      attachmentNames: ["客户行程说明.docx"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.APPROVED,
      submittedAt: new Date("2026-04-08T14:00:00+08:00"),
      decidedAt: new Date("2026-04-08T16:00:00+08:00")
    },
    create: {
      id: "oa-admin-request-travel",
      requestNo: "AR-TRA-20260408-DEMO02",
      type: AdministrativeRequestType.TRAVEL,
      title: "上海客户现场出差申请",
      summary: "上海 / 2026-04-15 09:00:00 至 2026-04-16 18:00:00 / 高铁",
      reason: "前往客户现场完成需求澄清和项目启动。",
      formData: {
        startAt: "2026-04-15T09:00:00.000Z",
        endAt: "2026-04-16T18:00:00.000Z",
        destination: "上海",
        transportation: "高铁",
        estimatedAmount: 1800
      },
      attachmentNames: ["客户行程说明.docx"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.APPROVED,
      submittedAt: new Date("2026-04-08T14:00:00+08:00"),
      decidedAt: new Date("2026-04-08T16:00:00+08:00")
    }
  });

  await prisma.administrativeRequest.upsert({
    where: {
      id: "oa-admin-request-purchase"
    },
    update: {
      requestNo: "AR-PUR-20260410-DEMO03",
      type: AdministrativeRequestType.PURCHASE,
      title: "销售团队直播设备采购",
      summary: "补光灯套装 / 3 件 / 3600.00",
      reason: "为下周线上宣讲活动准备直播补光设备。",
      formData: {
        itemName: "补光灯套装",
        quantity: 3,
        budgetAmount: 3600,
        neededBy: "2026-04-14 18:00:00"
      },
      attachmentNames: ["采购比价表.xlsx"],
      applicantId: adminUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.PENDING,
      submittedAt: new Date("2026-04-10T09:30:00+08:00"),
      decidedAt: null
    },
    create: {
      id: "oa-admin-request-purchase",
      requestNo: "AR-PUR-20260410-DEMO03",
      type: AdministrativeRequestType.PURCHASE,
      title: "销售团队直播设备采购",
      summary: "补光灯套装 / 3 件 / 3600.00",
      reason: "为下周线上宣讲活动准备直播补光设备。",
      formData: {
        itemName: "补光灯套装",
        quantity: 3,
        budgetAmount: 3600,
        neededBy: "2026-04-14 18:00:00"
      },
      attachmentNames: ["采购比价表.xlsx"],
      applicantId: adminUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.PENDING,
      submittedAt: new Date("2026-04-10T09:30:00+08:00")
    }
  });

  await prisma.administrativeRequest.upsert({
    where: {
      id: "oa-admin-request-seal"
    },
    update: {
      requestNo: "AR-SEA-20260407-DEMO04",
      type: AdministrativeRequestType.SEAL,
      title: "框架合同盖章申请",
      summary: "2026 框架采购合同 / 合同章 / 2 份",
      reason: "客户已完成法务确认，需要尽快寄回盖章纸质件。",
      formData: {
        documentName: "2026 框架采购合同",
        sealType: "合同章",
        useDate: "2026-04-07 15:00:00",
        copyCount: 2
      },
      attachmentNames: ["框架合同-v5.pdf"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.REJECTED,
      submittedAt: new Date("2026-04-07T11:00:00+08:00"),
      decidedAt: new Date("2026-04-07T13:20:00+08:00")
    },
    create: {
      id: "oa-admin-request-seal",
      requestNo: "AR-SEA-20260407-DEMO04",
      type: AdministrativeRequestType.SEAL,
      title: "框架合同盖章申请",
      summary: "2026 框架采购合同 / 合同章 / 2 份",
      reason: "客户已完成法务确认，需要尽快寄回盖章纸质件。",
      formData: {
        documentName: "2026 框架采购合同",
        sealType: "合同章",
        useDate: "2026-04-07 15:00:00",
        copyCount: 2
      },
      attachmentNames: ["框架合同-v5.pdf"],
      applicantId: staffUser.id,
      approverId: adminUser.id,
      status: AdministrativeRequestStatus.REJECTED,
      submittedAt: new Date("2026-04-07T11:00:00+08:00"),
      decidedAt: new Date("2026-04-07T13:20:00+08:00")
    }
  });

  await prisma.administrativeRequestAction.createMany({
    data: [
      {
        id: "oa-admin-action-reimbursement-submitted",
        requestId: "oa-admin-request-reimbursement",
        actorId: staffUser.id,
        actionType: AdministrativeRequestActionType.SUBMITTED,
        snapshot: {
          expenseDate: "2026-04-06 00:00:00",
          expenseCategory: "差旅交通",
          payeeName: "kyle",
          amount: 1280.5
        },
        createdAt: new Date("2026-04-09T10:20:00+08:00")
      },
      {
        id: "oa-admin-action-travel-submitted",
        requestId: "oa-admin-request-travel",
        actorId: staffUser.id,
        actionType: AdministrativeRequestActionType.SUBMITTED,
        snapshot: {
          destination: "上海",
          transportation: "高铁"
        },
        createdAt: new Date("2026-04-08T14:00:00+08:00")
      },
      {
        id: "oa-admin-action-travel-approved",
        requestId: "oa-admin-request-travel",
        actorId: adminUser.id,
        actionType: AdministrativeRequestActionType.APPROVED,
        comment: "行程明确，注意同步拜访纪要。",
        createdAt: new Date("2026-04-08T16:00:00+08:00")
      },
      {
        id: "oa-admin-action-purchase-submitted",
        requestId: "oa-admin-request-purchase",
        actorId: adminUser.id,
        actionType: AdministrativeRequestActionType.SUBMITTED,
        snapshot: {
          itemName: "补光灯套装",
          quantity: 3
        },
        createdAt: new Date("2026-04-10T09:30:00+08:00")
      },
      {
        id: "oa-admin-action-seal-submitted",
        requestId: "oa-admin-request-seal",
        actorId: staffUser.id,
        actionType: AdministrativeRequestActionType.SUBMITTED,
        snapshot: {
          documentName: "2026 框架采购合同",
          sealType: "合同章"
        },
        createdAt: new Date("2026-04-07T11:00:00+08:00")
      },
      {
        id: "oa-admin-action-seal-rejected",
        requestId: "oa-admin-request-seal",
        actorId: adminUser.id,
        actionType: AdministrativeRequestActionType.REJECTED,
        comment: "请补充最终定稿版本后重新提交。",
        createdAt: new Date("2026-04-07T13:20:00+08:00")
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // Seed 失败需要向上抛出，让命令行明确感知执行失败。
    await prisma.$disconnect();
    throw error;
  });
