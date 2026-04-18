<!-- 行政申请检索页面：负责面向管理员按多条件查询行政申请并查看详情。 -->
<template>
  <section class="page-shell">
    <section class="page-card filter-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">检索中心</span>
          <h2 class="page-section-title">行政申请检索</h2>
        </div>
        <p class="page-section-caption">按申请人、审批人、状态与时间范围检索高频行政申请记录。</p>
      </div>

      <div class="filter-toolbar">
        <el-select v-model="filters.type" clearable placeholder="全部类型" size="small" class="filter-field">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="全部状态" size="small" class="filter-field">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select
          v-model="filters.applicantId"
          clearable
          filterable
          :loading="isMemberLoading"
          placeholder="申请人"
          size="small"
          class="filter-field"
        >
          <el-option
            v-for="item in memberOptions"
            :key="`applicant-${item.id}`"
            :label="item.displayName"
            :value="item.id"
          />
        </el-select>
        <el-select
          v-model="filters.approverId"
          clearable
          filterable
          :loading="isMemberLoading"
          placeholder="审批人"
          size="small"
          class="filter-field"
        >
          <el-option
            v-for="item in memberOptions"
            :key="`approver-${item.id}`"
            :label="item.displayName"
            :value="item.id"
          />
        </el-select>
        <el-date-picker
          v-model="filters.startDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="开始日期"
          size="small"
          class="filter-field"
        />
        <el-date-picker
          v-model="filters.endDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="结束日期"
          size="small"
          class="filter-field"
        />
        <div class="filter-actions">
          <el-button type="primary" size="small" :loading="isLoading" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <section class="page-card table-shell">
      <el-table v-if="requests.length" :data="requests" border>
        <el-table-column prop="requestNo" label="申请编号" min-width="180" />
        <el-table-column label="申请类型" min-width="120">
          <template #default="{ row }">{{ formatAdministrativeRequestType(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="applicantName" label="申请人" min-width="120" />
        <el-table-column prop="approverName" label="审批人" min-width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="status-pill" :class="row.status.toLowerCase()">
              {{ formatAdministrativeRequestStatus(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.submittedAt) }}</template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text @click="openAdministrativeRequestDetail(row.id)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else-if="!isLoading" description="当前筛选条件下没有行政申请记录" />
    </section>

    <AdministrativeRequestDetailDrawer
      v-model:visible="drawerVisible"
      :request="request"
      :is-loading="isRequestLoading"
      :is-tablet-or-down="isTabletOrDown"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { fetchAdministrativeRequestRecordDetail } from "@/api/administrative-requests.api";
import { useAdministrativeRequestDetailDrawer } from "@/composables/administrative-requests/useAdministrativeRequestDetailDrawer";
import { useAdministrativeRequestSearchPage } from "@/composables/administrative-requests/useAdministrativeRequestSearchPage";
import AdministrativeRequestDetailDrawer from "@/pages/administrative-requests/components/AdministrativeRequestDetailDrawer.vue";
import {
  formatAdministrativeRequestStatus,
  formatAdministrativeRequestType,
  formatDateTime
} from "@/utils/display";

const { filters, isLoading, isMemberLoading, loadData, memberOptions, requests, resetFilters } =
  useAdministrativeRequestSearchPage();
const {
  drawerVisible,
  isLoading: isRequestLoading,
  isTabletOrDown,
  openAdministrativeRequestDetail,
  request
} = useAdministrativeRequestDetailDrawer(fetchAdministrativeRequestRecordDetail);

const typeOptions = computed(() => [
  { label: "报销申请", value: "REIMBURSEMENT" },
  { label: "出差申请", value: "TRAVEL" },
  { label: "采购申请", value: "PURCHASE" },
  { label: "用印申请", value: "SEAL" }
]);

const statusOptions = computed(() => [
  { label: "待审批", value: "PENDING" },
  { label: "已通过", value: "APPROVED" },
  { label: "已驳回", value: "REJECTED" },
  { label: "已撤销", value: "CANCELLED" }
]);
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.filter-card,
.table-shell {
  display: grid;
  gap: 18px;
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

.filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-field {
  width: 180px;
}

.filter-field :deep(.el-select__wrapper),
.filter-field :deep(.el-input__wrapper),
.filter-actions :deep(.el-button) {
  min-height: 36px;
}

.filter-actions {
  display: inline-flex;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 960px) {
  .section-head {
    display: grid;
  }

  .filter-actions {
    margin-left: 0;
  }
}
</style>
