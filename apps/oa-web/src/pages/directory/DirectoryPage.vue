<!-- 通讯录页面：负责组装部门筛选和员工信息卡片。 -->
<template>
  <div class="page-grid">
    <section class="page-card filter-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">组织检索</span>
          <h2 class="page-section-title">组织通讯录</h2>
        </div>
        <p class="page-section-caption">按部门查看成员。</p>
      </div>

      <div class="filter-toolbar">
        <el-select
          v-model="selectedDepartmentId"
          placeholder="查看全部部门成员"
          clearable
          size="small"
          class="filter-field"
        >
          <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" size="small" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="member-grid" v-if="members.length">
      <article v-for="item in members" :key="item.id" class="page-card member-card">
        <div class="member-avatar">{{ item.displayName.slice(0, 1) }}</div>
        <div class="member-name">{{ item.displayName }}</div>
        <div class="member-meta">{{ item.departmentName || "未分配部门" }}</div>
        <div class="member-contact">{{ item.email || item.phone || item.username }}</div>
      </article>
    </section>
    <section v-else class="page-card">
      <el-empty description="当前筛选条件下没有可展示的成员" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useDirectoryPage } from "@/composables/directory/useDirectoryPage";

const { departments, loadData, members, selectedDepartmentId } = useDirectoryPage();

function resetFilters(): void {
  if (!selectedDepartmentId.value) {
    void loadData();
    return;
  }

  selectedDepartmentId.value = null;
}
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
}

.filter-card {
  display: grid;
  gap: 14px;
}

.filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: fit-content;
  max-width: 100%;
}

.filter-field {
  width: 220px;
}

.filter-field :deep(.el-select__wrapper),
.filter-actions :deep(.el-button) {
  min-height: 36px;
}

.filter-actions {
  display: inline-flex;
  gap: 8px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.section-head .page-section-caption {
  max-width: 420px;
  margin: 0;
}

.member-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.member-card {
  display: grid;
  gap: 8px;
  justify-items: start;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent 68%),
    rgba(255, 255, 255, 0.84);
}

.member-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--app-accent-strong);
  font-size: 20px;
  font-weight: 700;
}

.member-name {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 700;
}

.member-meta {
  color: var(--app-text-secondary);
}

.member-contact {
  color: var(--app-text-primary);
  font-size: 13px;
}

@media (max-width: 640px) {
  .section-head {
    flex-direction: column;
  }

  .filter-toolbar {
    width: 100%;
  }

  .filter-field {
    flex: 1 1 200px;
    min-width: 0;
  }

  .filter-actions {
    margin-left: auto;
  }
}

@media (max-width: 520px) {
  .filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
