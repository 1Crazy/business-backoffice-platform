/** 领域类型定义：负责维护当前子域的请求、响应和表单模型契约。 */
export interface DictionaryEntry {
  id: string;
  type: string;
  label: string;
  value: string;
  sort: number;
  enabled: boolean;
}
