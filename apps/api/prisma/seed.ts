import {
  ApprovalActionDecision,
  DataScope,
  LeaveRequestStatus,
  PrismaClient,
  RecordStatus,
  UserStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissionSeeds = [
  ["scrm", "dashboard:view", "查看看板", "dashboard"],
  ["platform", "department:read", "查看部门", "access"],
  ["platform", "department:write", "编辑部门", "access"],
  ["platform", "user:read", "查看员工", "access"],
  ["platform", "user:write", "编辑员工", "access"],
  ["platform", "role:read", "查看角色", "access"],
  ["platform", "role:write", "编辑角色", "access"],
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
  ["oa", "oa:leave:apply", "提交请假申请", "leave"],
  ["oa", "oa:announcement:read", "查看公告通知", "announcement"],
  ["oa", "oa:directory:read", "查看组织通讯录", "directory"]
] as const;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("Admin123456!", 10);

  const defaultDepartment = await prisma.department.upsert({
    where: { code: "HQ" },
    update: {},
    create: {
      name: "总部",
      code: "HQ"
    }
  });

  const operationsDepartment = await prisma.department.upsert({
    where: { code: "OPS" },
    update: {
      name: "运营中心",
      status: RecordStatus.ACTIVE
    },
    create: {
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
      name: "超级管理员",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.ALL
    },
    create: {
      name: "超级管理员",
      code: "super-admin",
      isSystem: true,
      dataScope: DataScope.ALL
    }
  });

  const salesManagerRole = await prisma.role.upsert({
    where: { code: "sales-manager" },
    update: {
      name: "销售主管",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.DEPARTMENT
    },
    create: {
      name: "销售主管",
      code: "sales-manager",
      isSystem: true,
      dataScope: DataScope.DEPARTMENT
    }
  });

  const salesMemberRole = await prisma.role.upsert({
    where: { code: "sales-member" },
    update: {
      name: "销售成员",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.SELF
    },
    create: {
      name: "销售成员",
      code: "sales-member",
      isSystem: true,
      dataScope: DataScope.SELF
    }
  });

  const oaMemberRole = await prisma.role.upsert({
    where: { code: "oa-member" },
    update: {
      name: "OA 普通员工",
      status: RecordStatus.ACTIVE,
      isSystem: true,
      dataScope: DataScope.SELF
    },
    create: {
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
      displayName: "系统管理员",
      passwordHash,
      departmentId: defaultDepartment.id,
      status: UserStatus.ACTIVE
    },
    create: {
      username: "admin",
      displayName: "系统管理员",
      passwordHash,
      departmentId: defaultDepartment.id
    }
  });

  const staffUser = await prisma.user.upsert({
    where: { username: "kyle" },
    update: {
      displayName: "kyle",
      passwordHash,
      departmentId: operationsDepartment.id,
      email: "wangyuhong7777@163.com",
      phone: "13800000002",
      status: UserStatus.ACTIVE
    },
    create: {
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

  await prisma.dictionaryEntry.createMany({
    data: [
      { type: "customer-source", label: "官网表单", value: "website", sort: 1 },
      { type: "customer-source", label: "活动获客", value: "campaign", sort: 2 },
      { type: "customer-status", label: "新客户", value: "new", sort: 1 },
      { type: "customer-status", label: "跟进中", value: "active", sort: 2 }
    ],
    skipDuplicates: true
  });

  await prisma.announcement.upsert({
    where: { id: "oa-announcement-holiday" },
    update: {
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
