<template>
  <section class="page-card toolbar">
    <div>
      <h2>运营看板</h2>
      <p>默认统计最近 30 天，并按当前账号的数据权限范围收口。</p>
    </div>
    <el-date-picker
      v-model="model"
      class="toolbar-picker"
      type="daterange"
      unlink-panels
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      @change="$emit('change')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { DashboardDateRange } from "@/types/dashboard";

const props = defineProps<{
  modelValue: DashboardDateRange;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: DashboardDateRange];
  change: [];
}>();

const model = computed({
  get: () => props.modelValue,
  set: (value: DashboardDateRange) => emit("update:modelValue", value)
});
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-picker {
  width: 340px;
  max-width: 100%;
}

.toolbar h2 {
  margin: 0 0 6px;
}

.toolbar p {
  margin: 0;
  color: #64748b;
}

@media (max-width: 960px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-picker {
    width: 100%;
  }
}
</style>
