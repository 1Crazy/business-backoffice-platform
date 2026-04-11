<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card toolbar">
    <div class="toolbar-copy">
      <span class="toolbar-kicker">运营看板</span>
      <h2>销售概览</h2>
      <p>聚合客户、线索和商机的核心指标，便于快速掌握当前经营状态。</p>
    </div>
    <div class="toolbar-controls">
      <div class="toolbar-metrics">
        <span v-if="refreshing" class="loading-badge">数据同步中</span>
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { DashboardDateRange } from "@/types/dashboard";

const props = defineProps<{
  modelValue: DashboardDateRange;
  refreshing?: boolean;
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 20px;
}

.toolbar-copy {
  display: grid;
  gap: 6px;
}

.toolbar-kicker {
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.toolbar-copy h2 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}

.toolbar-copy p {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.toolbar-controls {
  display: grid;
  justify-items: end;
  gap: 10px;
}

.toolbar-metrics {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.toolbar-picker {
  width: 320px;
  max-width: 100%;
}

@media (max-width: 960px) {
  .toolbar {
    grid-template-columns: 1fr;
  }

  .toolbar-controls {
    justify-items: stretch;
  }

  .toolbar-picker {
    width: 100%;
  }
}
</style>
