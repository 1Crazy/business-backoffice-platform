/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
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
