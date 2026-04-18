/** dictionaries 模块 repository：负责 dictionaries 领域的 Prisma 查询、写入与关联装载。 */
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "@/common/prisma/prisma.service";

export type DictionaryEntryRecord = Prisma.DictionaryEntryGetPayload<Record<string, never>>;

@Injectable()
export class DictionariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, type?: string, enabled?: boolean) {
    return this.prisma.dictionaryEntry.findMany({
      where: {
        tenantId,
        type,
        enabled
      },
      orderBy: [{ type: "asc" }, { sort: "asc" }]
    });
  }

  createEntry(input: {
    tenantId: string;
    type: string;
    label: string;
    value: string;
    sort: number;
    enabled: boolean;
  }) {
    return this.prisma.dictionaryEntry.create({
      data: {
        tenantId: input.tenantId,
        type: input.type,
        label: input.label,
        value: input.value,
        sort: input.sort,
        enabled: input.enabled
      }
    });
  }

  updateEntry(
    id: string,
    tenantId: string,
    input: {
      type?: string;
      label?: string;
      value?: string;
      sort?: number;
      enabled?: boolean;
    }
  ) {
    return this.prisma.dictionaryEntry.updateMany({
      where: {
        id,
        tenantId
      },
      data: {
        type: input.type,
        label: input.label,
        value: input.value,
        sort: input.sort,
        enabled: input.enabled
      }
    }).then(() =>
      this.prisma.dictionaryEntry.findFirstOrThrow({
        where: {
          id,
          tenantId
        }
      })
    );
  }
}
