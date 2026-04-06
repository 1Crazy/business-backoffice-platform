<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="upload-panel">
    <div class="upload-head">
      <div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
      <el-upload
        :show-file-list="false"
        :disabled="uploadDisabled"
        :http-request="handleUpload"
      >
        <el-button type="primary">上传附件</el-button>
      </el-upload>
    </div>

    <el-empty v-if="!attachments.length" :description="emptyDescription" />

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
import type { UploadRequestOptions } from "element-plus";

import type { Attachment } from "@/types/uploads";

withDefaults(
  defineProps<{
    attachments: Attachment[];
    title?: string;
    description?: string;
    emptyDescription?: string;
    uploadDisabled?: boolean;
  }>(),
  {
    title: "附件",
    description: "支持将业务附件关联到当前记录，便于销售跟进时统一查看。",
    emptyDescription: "暂无附件",
    uploadDisabled: false
  }
);

const emit = defineEmits<{
  upload: [options: UploadRequestOptions];
}>();

function handleUpload(options: UploadRequestOptions): void {
  emit("upload", options);
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
