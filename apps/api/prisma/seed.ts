import { PrismaClient, RecordStatus, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissionSeeds = [
  ["dashboard:view", "查看看板", "dashboard"],
  ["department:read", "查看部门", "access"],
  ["department:write", "编辑部门", "access"],
  ["user:read", "查看员工", "access"],
  ["user:write", "编辑员工", "access"],
  ["role:read", "查看角色", "access"],
  ["role:write", "编辑角色", "access"],
  ["customer:read", "查看客户", "customer"],
  ["customer:write", "编辑客户", "customer"],
  ["customer:assign", "转交客户", "customer"],
  ["lead:read", "查看线索", "lead"],
  ["lead:write", "编辑线索", "lead"],
  ["lead:assign", "分配线索", "lead"],
  ["lead:convert", "转换线索", "lead"],
  ["followup:write", "记录跟进", "lead"],
  ["dictionary:read", "查看字典", "system"],
  ["dictionary:write", "编辑字典", "system"],
  ["audit-log:read", "查看审计日志", "system"],
  ["upload:write", "上传附件", "system"]
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

  const permissions = await Promise.all(
    permissionSeeds.map(([code, name, group]) =>
      prisma.permission.upsert({
        where: { code },
        update: { name, group },
        create: { code, name, group }
      })
    )
  );

  const allPermissionIds = permissions.map((item) => item.id);

  const superAdminRole = await prisma.role.upsert({
    where: { code: "super-admin" },
    update: {
      name: "超级管理员",
      status: RecordStatus.ACTIVE,
      isSystem: true
    },
    create: {
      name: "超级管理员",
      code: "super-admin",
      isSystem: true
    }
  });

  const salesManagerRole = await prisma.role.upsert({
    where: { code: "sales-manager" },
    update: {
      name: "销售主管",
      status: RecordStatus.ACTIVE,
      isSystem: true
    },
    create: {
      name: "销售主管",
      code: "sales-manager",
      isSystem: true
    }
  });

  const salesMemberRole = await prisma.role.upsert({
    where: { code: "sales-member" },
    update: {
      name: "销售成员",
      status: RecordStatus.ACTIVE,
      isSystem: true
    },
    create: {
      name: "销售成员",
      code: "sales-member",
      isSystem: true
    }
  });

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: {
        in: [superAdminRole.id, salesManagerRole.id, salesMemberRole.id]
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

  await prisma.dictionaryEntry.createMany({
    data: [
      { type: "customer-source", label: "官网表单", value: "website", sort: 1 },
      { type: "customer-source", label: "活动获客", value: "campaign", sort: 2 },
      { type: "customer-status", label: "新客户", value: "new", sort: 1 },
      { type: "customer-status", label: "跟进中", value: "active", sort: 2 }
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

