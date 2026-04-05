import type { DictionaryEntryRecord } from "../repositories/dictionaries.repository";

export function mapDictionaryEntry(record: DictionaryEntryRecord) {
  return {
    id: record.id,
    type: record.type,
    label: record.label,
    value: record.value,
    sort: record.sort,
    enabled: record.enabled
  };
}
