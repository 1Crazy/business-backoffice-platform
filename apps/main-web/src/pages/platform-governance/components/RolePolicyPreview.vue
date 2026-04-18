<template>
  <section class="policy-preview">
    <article class="policy-preview-card">
      <span>数据范围</span>
      <strong>{{ preview.dataScopeLabel }}</strong>
    </article>
    <article class="policy-preview-card">
      <span>覆盖应用</span>
      <strong>{{ preview.domainLabels.join(" / ") || "未选择" }}</strong>
    </article>
    <article class="policy-preview-card">
      <span>扩展范围</span>
      <strong>{{ preview.extendedScopeLabels.join(" / ") || "未配置" }}</strong>
    </article>
    <article class="policy-preview-card">
      <span>字段规则</span>
      <strong>{{ preview.fieldRuleCount ? `${preview.fieldRuleCount} 条` : "未配置" }}</strong>
    </article>
    <article class="policy-preview-card">
      <span>动作限制</span>
      <strong>{{ preview.actionRuleCount ? `${preview.actionRuleCount} 条` : "未配置" }}</strong>
    </article>
    <article class="policy-preview-card">
      <span>关键动作</span>
      <strong>{{ preview.actionLabels.join(" / ") || "未选择" }}</strong>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { RolePolicyPreview } from "@/pages/platform-governance/policy-helpers";

defineProps<{
  preview: RolePolicyPreview;
}>();
</script>

<style scoped>
.policy-preview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.policy-preview-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.policy-preview-card span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.policy-preview-card strong {
  color: #0f172a;
  line-height: 1.5;
}
</style>
