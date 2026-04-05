<template>
  <section class="summary-grid">
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
  </section>
</template>

<script setup lang="ts">
import type { Department, Role, User } from "@/types/access-control";

defineProps<{
  departments: Department[];
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
  gap: 10px;
}

.summary-card span {
  color: #64748b;
}

.summary-card strong {
  font-size: 34px;
  color: #0f172a;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
