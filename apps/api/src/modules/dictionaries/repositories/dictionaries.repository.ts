import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../../common/prisma/prisma.service";

export type DictionaryEntryRecord = Prisma.DictionaryEntryGetPayload<Record<string, never>>;

@Injectable()
export class DictionariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(type?: string, enabled?: boolean) {
    return this.prisma.dictionaryEntry.findMany({
      where: {
        type,
        enabled
      },
      orderBy: [{ type: "asc" }, { sort: "asc" }]
    });
  }

  createEntry(input: {
    type: string;
    label: string;
    value: string;
    sort: number;
    enabled: boolean;
  }) {
    return this.prisma.dictionaryEntry.create({
      data: {
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
    input: {
      type?: string;
      label?: string;
      value?: string;
      sort?: number;
      enabled?: boolean;
    }
  ) {
    return this.prisma.dictionaryEntry.update({
      where: { id },
      data: {
        type: input.type,
        label: input.label,
        value: input.value,
        sort: input.sort,
        enabled: input.enabled
      }
    });
  }
}
