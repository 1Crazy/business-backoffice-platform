/** workflow API：负责封装模板驱动流程相关请求。 */
import { http } from "@/api/http";
import type {
  ApprovalActionPayload,
  WorkflowInstance,
  WorkflowPendingTask,
  WorkflowTemplate,
  WorkflowTemplateKey
} from "@/types/office-automation";

interface StartWorkflowPayload {
  title: string;
  businessKey?: string;
  formData: Record<string, unknown>;
  ccUserIds?: string[];
}

export async function fetchActiveWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const { data } = await http.get<WorkflowTemplate[]>("/workflows/templates/active");
  return data;
}

export async function fetchMyWorkflowInstances(): Promise<WorkflowInstance[]> {
  const { data } = await http.get<WorkflowInstance[]>("/workflows/instances/mine");
  return data;
}

export async function fetchWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
  const { data } = await http.get<WorkflowInstance>(`/workflows/instances/${instanceId}`);
  return data;
}

export async function fetchPendingWorkflowTasks(): Promise<WorkflowPendingTask[]> {
  const { data } = await http.get<WorkflowPendingTask[]>("/workflows/tasks/pending");
  return data;
}

export async function startWorkflowByTemplateKey(
  templateKey: WorkflowTemplateKey,
  payload: StartWorkflowPayload
): Promise<WorkflowInstance> {
  const { data } = await http.post<WorkflowInstance>(`/workflows/templates/key/${templateKey}/start`, payload);
  return data;
}

export async function approveWorkflowTask(taskId: string, payload: ApprovalActionPayload): Promise<WorkflowInstance> {
  const { data } = await http.post<WorkflowInstance>(`/workflows/tasks/${taskId}/approve`, payload);
  return data;
}

export async function rejectWorkflowTask(taskId: string, payload: ApprovalActionPayload): Promise<WorkflowInstance> {
  const { data } = await http.post<WorkflowInstance>(`/workflows/tasks/${taskId}/reject`, payload);
  return data;
}

export async function cancelWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
  const { data } = await http.post<WorkflowInstance>(`/workflows/instances/${instanceId}/cancel`);
  return data;
}
