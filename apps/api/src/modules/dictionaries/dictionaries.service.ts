/** dictionaries 模块 service：负责业务编排、副作用协同和权限相关流程，数据库访问统一下沉到 repository。 */
import { Injectable } from "@nestjs/common";
import { AuditActionType } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { mapDictionaryEntry } from "./mappers/dictionaries.mapper";
import { DictionariesRepository } from "./repositories/dictionaries.repository";
import { CreateDictionaryEntryDto } from "./dto/create-dictionary-entry.dto";
import { ListDictionariesDto } from "./dto/list-dictionaries.dto";
import { UpdateDictionaryEntryDto } from "./dto/update-dictionary-entry.dto";

@Injectable()
export class DictionariesService {
  constructor(
    private readonly dictionariesRepository: DictionariesRepository,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(query: ListDictionariesDto) {
    const entries = await this.dictionariesRepository.list(query.type, query.enabled);

    return entries.map((entry) => mapDictionaryEntry(entry));
  }

  async create(dto: CreateDictionaryEntryDto, actor: AuthUser) {
    const entry = await this.dictionariesRepository.createEntry({
      type: dto.type,
      label: dto.label,
      value: dto.value,
      sort: dto.sort ?? 0,
      enabled: dto.enabled ?? true
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "dictionary",
      targetId: entry.id
    });

    return mapDictionaryEntry(entry);
  }

  async update(id: string, dto: UpdateDictionaryEntryDto, actor: AuthUser) {
    const entry = await this.dictionariesRepository.updateEntry(id, {
      type: dto.type,
      label: dto.label,
      value: dto.value,
      sort: dto.sort,
      enabled: dto.enabled
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "dictionary",
      targetId: entry.id
    });

    return mapDictionaryEntry(entry);
  }
}
