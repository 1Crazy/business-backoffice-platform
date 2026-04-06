<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="page-card toolbar">
    <div class="toolbar-copy">
      <span class="toolbar-kicker">销售运营</span>
      <div class="toolbar-head">
        <div>
          <h2>运营看板</h2>
          <p>默认统计最近 30 天，并按当前账号的数据权限范围收口，让指标、范围和判断发生在同一首屏结构里。</p>
        </div>
        <div class="toolbar-badges">
          <span v-if="refreshing" class="loading-badge">数据同步中</span>
          <span class="toolbar-badge">统一口径</span>
          <span class="toolbar-badge">权限收口</span>
        </div>
      </div>
    </div>
    <div class="toolbar-controls">
      <span class="toolbar-label">统计周期</span>
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
  gap: 18px;
}

.toolbar-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.toolbar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.toolbar-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-badge {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid rgba(95, 125, 170, 0.12);
}

.toolbar-label {
  color: var(--app-text-secondary);
  font-size: 13px;
  font-weight: 600;
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
  color: var(--app-text-secondary);
  line-height: 1.75;
}

@media (max-width: 960px) {
  .toolbar-head,
  .toolbar-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-picker {
    width: 100%;
  }
}
</style>
