<!-- 复用组件：负责承载跨页面共享的展示或交互骨架，通过 props / emits 与页面协作。 -->
<template>
  <section class="summary-grid">
    <template v-if="loading">
      <article v-for="item in 3" :key="item" class="page-card summary-card">
        <span class="ui-skeleton ui-skeleton-line short" />
        <span class="ui-skeleton ui-skeleton-line medium skeleton-value" />
      </article>
    </template>
    <template v-else>
      <article class="page-card summary-card">
        <span>部门数</span>
        <strong>{{ departments.length }}</strong>
      </article>
      <article class="page-card summary-card">
        <span>员工数</span>
        <strong>{{ users.length }}</strong>
      </article>
      <article class="page-card summary-card">
        <span>角色数</span>
        <strong>{{ roles.length }}</strong>
      </article>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { Department, Role, User } from "@/types/access-control";

defineProps<{
  departments: Department[];
  loading?: boolean;
  users: User[];
  roles: Role[];
}>();
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.summary-card {
  display: grid;
  gap: 8px;
}

.summary-card span {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.summary-card strong {
  font-size: 40px;
  color: var(--app-text-primary);
  letter-spacing: -0.04em;
}

.skeleton-value {
  height: 30px;
  width: 44%;
  border-radius: 14px;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
