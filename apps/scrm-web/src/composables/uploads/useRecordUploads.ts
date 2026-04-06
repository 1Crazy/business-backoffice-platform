/** 场景 composable：负责页面状态、请求编排和错误反馈策略的复用。 */
import { ElMessage, type UploadRequestOptions } from "element-plus";
import { ref, watch } from "vue";

import { fetchAttachments, uploadAttachment } from "@/api/uploads.api";
import type { Attachment, AttachmentQuery } from "@/types/uploads";
import { getRequestErrorMessage } from "@/utils/request";

interface UseRecordUploadsOptions {
  getQuery: () => AttachmentQuery | null;
  successMessage?: string;
}

export function useRecordUploads(options: UseRecordUploadsOptions) {
  const attachments = ref<Attachment[]>([]);

  async function loadAttachments(): Promise<void> {
    const query = options.getQuery();

    if (!query?.businessId) {
      attachments.value = [];
      return;
    }

    try {
      attachments.value = await fetchAttachments(query);
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "附件列表加载失败，请稍后重试。"));
    }
  }

  async function handleUpload(optionsValue: UploadRequestOptions): Promise<void> {
    const query = options.getQuery();

    if (!optionsValue.file || !query?.businessId) {
      return;
    }

    try {
      await uploadAttachment({
        businessType: query.businessType,
        businessId: query.businessId,
        file: optionsValue.file
      });
      ElMessage.success(options.successMessage ?? "附件上传成功。");
      await loadAttachments();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "附件上传失败，请稍后重试。"));
    }
  }

  // 记录切换时需要立即刷新附件列表，否则抽屉里会短暂残留上一个客户/线索的附件。
  watch(
    () => {
      const query = options.getQuery();
      return [query?.businessType ?? "", query?.businessId ?? ""];
    },
    () => {
      void loadAttachments();
    },
    { immediate: true }
  );

  return {
    attachments,
    loadAttachments,
    handleUpload
  };
}
