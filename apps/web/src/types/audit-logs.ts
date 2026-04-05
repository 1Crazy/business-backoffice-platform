export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt: string;
}
