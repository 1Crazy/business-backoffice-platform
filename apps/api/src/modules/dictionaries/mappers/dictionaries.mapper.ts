/** dictionaries 模块 mapper：负责把持久化结果转换为对外契约或上层可消费的数据结构。 */
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
