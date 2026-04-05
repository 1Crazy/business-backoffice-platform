import { Injectable } from "@nestjs/common";
import { AuditActionType, RecordStatus } from "@prisma/client";

import { mapDepartment } from "../../common/mappers/access-control.mapper";
import type { AuthUser } from "../../common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { DepartmentsRepository } from "./repositories/departments.repository";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly departmentsRepository: DepartmentsRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list() {
    const departments = await this.departmentsRepository.list();

    return departments.map((department) => mapDepartment(department));
  }

  async create(dto: CreateDepartmentDto, actor: AuthUser) {
    const department = await this.departmentsRepository.createDepartment({
      name: dto.name,
      code: dto.code,
      parentId: dto.parentId
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "department",
      targetId: department.id
    });

    return mapDepartment(department);
  }

  async update(id: string, dto: UpdateDepartmentDto, actor: AuthUser) {
    const department = await this.departmentsRepository.updateDepartment(id, {
      name: dto.name,
      code: dto.code,
      parentId: dto.parentId === undefined ? undefined : dto.parentId
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "department",
      targetId: department.id
    });

    return mapDepartment(department);
  }

  async toggle(id: string, status: RecordStatus, actor: AuthUser) {
    const department = await this.departmentsRepository.updateStatus(id, status);

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: status === RecordStatus.ACTIVE ? AuditActionType.ENABLE : AuditActionType.DISABLE,
      targetType: "department",
      targetId: department.id
    });

    return mapDepartment(department);
  }
}
