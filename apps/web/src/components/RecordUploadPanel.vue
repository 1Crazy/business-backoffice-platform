<template>
  <section class="upload-panel">
    <div class="upload-head">
      <div>
        <h3>附件</h3>
        <p>支持将业务附件关联到当前记录，便于销售跟进时统一查看。</p>
      </div>
      <el-upload
        :show-file-list="false"
        :http-request="handleUpload"
      >
        <el-button type="primary">上传附件</el-button>
      </el-upload>
    </div>

    <el-empty v-if="!attachments.length" description="暂无附件" />

    <el-table v-else :data="attachments" border>
      <el-table-column prop="originalName" label="文件名" min-width="220" />
      <el-table-column prop="mimeType" label="类型" min-width="160" />
      <el-table-column prop="size" label="大小">
        <template #default="{ row }">
          {{ formatSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="上传时间" min-width="180" />
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, type UploadRequestOptions } from "element-plus";
import { onMounted, ref, watch } from "vue";

import { http } from "../api/http";
import type { Attachment } from "../types/entities";

const props = defineProps<{
  businessType: "CUSTOMER" | "LEAD";
  businessId: string;
}>();

const attachments = ref<Attachment[]>([]);

async function loadAttachments(): Promise<void> {
  if (!props.businessId) {
    attachments.value = [];
    return;
  }

  const { data } = await http.get<Attachment[]>("/uploads", {
    params: {
      businessType: props.businessType,
      businessId: props.businessId
    }
  });

  attachments.value = data;
}

async function handleUpload(options: UploadRequestOptions): Promise<void> {
  if (!options.file) {
    return;
  }

  const formData = new FormData();
  formData.append("businessType", props.businessType);
  formData.append("businessId", props.businessId);
  formData.append("file", options.file);

  await http.post("/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  ElMessage.success("附件上传成功。");
  await loadAttachments();
}

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

watch(
  () => props.businessId,
  () => {
    void loadAttachments();
  }
);

onMounted(() => {
  void loadAttachments();
});
</script>

<style scoped>
.upload-panel {
  display: grid;
  gap: 14px;
}

.upload-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.upload-head h3 {
  margin: 0 0 4px;
}

.upload-head p {
  margin: 0;
  color: #64748b;
}
</style>

