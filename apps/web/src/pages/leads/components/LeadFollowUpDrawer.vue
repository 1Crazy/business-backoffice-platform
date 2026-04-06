<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <el-drawer v-model="drawerVisible" :size="isTabletOrDown ? '100%' : '58%'" :title="lead?.name ?? '线索跟进'">
    <div class="drawer-stack">
      <section class="page-card">
        <h3>跟进记录</h3>
        <el-timeline>
          <el-timeline-item v-for="item in followUps" :key="item.id" :timestamp="item.createdAt">
            <strong>{{ item.createdBy?.displayName }}</strong>
            <p>{{ item.content }}</p>
            <small v-if="item.reminder">提醒时间：{{ item.reminder.remindAt }}</small>
          </el-timeline-item>
        </el-timeline>
      </section>

      <section class="page-card">
        <h3>新增跟进</h3>
        <el-form
          :ref="setFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          require-asterisk-position="right"
          status-icon
          class="dialog-form"
        >
          <el-form-item label="跟进内容" prop="content" required>
            <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入本次跟进内容" />
          </el-form-item>
          <el-form-item label="下次跟进时间" prop="nextFollowUpAt">
            <el-date-picker
              v-model="form.nextFollowUpAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
              class="full-width"
            />
          </el-form-item>
          <el-button type="primary" @click="$emit('submit-follow-up')">保存跟进</el-button>
        </el-form>
      </section>

      <section v-if="lead" class="page-card">
        <RecordUploadPanel :attachments="attachments" @upload="$emit('upload', $event)" />
      </section>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadRequestOptions } from "element-plus";
import { computed } from "vue";

import RecordUploadPanel from "@/components/RecordUploadPanel.vue";
import type { FollowUp, FollowUpFormModel } from "@/types/follow-ups";
import type { Lead } from "@/types/leads";
import type { Attachment } from "@/types/uploads";

const props = defineProps<{
  visible: boolean;
  lead: Lead | null;
  followUps: FollowUp[];
  form: FollowUpFormModel;
  rules: FormRules<FollowUpFormModel>;
  attachments: Attachment[];
  isTabletOrDown: boolean;
  setFormRef: (instance: FormInstance | undefined) => void;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "submit-follow-up": [];
  upload: [options: UploadRequestOptions];
}>();

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value)
});
</script>

<style scoped>
.drawer-stack {
  display: grid;
  gap: 16px;
}

.full-width {
  width: 100%;
}
</style>
