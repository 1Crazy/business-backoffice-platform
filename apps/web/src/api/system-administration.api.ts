import { http } from "@/api/http";
import type { AuditLog } from "@/types/audit-logs";
import type { DictionaryEntry } from "@/types/dictionaries";
import type { PaginatedResponse } from "@/types/pagination";
import type { AuditLogQuery, SaveDictionaryPayload } from "@/types/system-administration";

export async function fetchDictionaries(): Promise<DictionaryEntry[]> {
  const { data } = await http.get<DictionaryEntry[]>("/dictionaries");
  return data;
}

export async function fetchAuditLogs(query: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await http.get<PaginatedResponse<AuditLog>>("/audit-logs", {
    params: query
  });
  return data;
}

export async function createDictionary(payload: SaveDictionaryPayload): Promise<void> {
  await http.post("/dictionaries", payload);
}

export async function updateDictionary(dictionaryId: string, payload: SaveDictionaryPayload): Promise<void> {
  await http.patch(`/dictionaries/${dictionaryId}`, payload);
}
