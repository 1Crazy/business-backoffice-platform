/** 领域 API：负责封装页面到后端的请求契约，避免页面直接依赖底层 HTTP 客户端。 */
import { http } from "@/api/http";
import type { Attachment, AttachmentQuery, AttachmentUploadPayload } from "@/types/uploads";

export async function fetchAttachments(query: AttachmentQuery): Promise<Attachment[]> {
  const { data } = await http.get<Attachment[]>("/uploads", {
    params: query
  });
  return data;
}

export async function uploadAttachment(payload: AttachmentUploadPayload): Promise<void> {
  const formData = new FormData();

  formData.append("businessType", payload.businessType);
  formData.append("businessId", payload.businessId);
  formData.append("file", payload.file);

  await http.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}
