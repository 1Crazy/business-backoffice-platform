import { Injectable } from "@nestjs/common";
import { AuditActionType } from "@prisma/client";

import type { AuthUser } from "../../common/auth/auth-user.interface";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateDictionaryEntryDto } from "./dto/create-dictionary-entry.dto";
import { ListDictionariesDto } from "./dto/list-dictionaries.dto";
import { UpdateDictionaryEntryDto } from "./dto/update-dictionary-entry.dto";

@Injectable()
export class DictionariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async list(query: ListDictionariesDto) {
    return this.prisma.dictionaryEntry.findMany({
      where: {
        type: query.type,
        enabled: query.enabled
      },
      orderBy: [{ type: "asc" }, { sort: "asc" }]
    });
  }

  async create(dto: CreateDictionaryEntryDto, actor: AuthUser) {
    const entry = await this.prisma.dictionaryEntry.create({
      data: {
        type: dto.type,
        label: dto.label,
        value: dto.value,
        sort: dto.sort ?? 0,
        enabled: dto.enabled ?? true
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType: "dictionary",
      targetId: entry.id
    });

    return entry;
  }

  async update(id: string, dto: UpdateDictionaryEntryDto, actor: AuthUser) {
    const entry = await this.prisma.dictionaryEntry.update({
      where: { id },
      data: {
        type: dto.type,
        label: dto.label,
        value: dto.value,
        sort: dto.sort,
        enabled: dto.enabled
      }
    });

    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.UPDATE,
      targetType: "dictionary",
      targetId: entry.id
    });

    return entry;
  }
}

