<!-- 待我审批页面：负责组装审批列表和通过/驳回操作。 -->
<template>
  <section class="page-card table-page">
    <div class="section-head">
      <div>
        <span class="page-kicker">待办流程</span>
        <h2 class="page-section-title">待我审批</h2>
      </div>
      <p class="page-section-caption">当前待处理事项。</p>
    </div>

    <div class="page-table-shell">
      <el-table :data="approvals" border>
        <el-table-column prop="applicantName" label="申请人" min-width="120" />
        <el-table-column label="请假类型" min-width="120">
          <template #default="{ row }">{{ formatLeaveType(row.leaveType) }}</template>
        </el-table-column>
        <el-table-column label="请假时间" min-width="220">
          <template #default="{ row }">{{ row.startAt }} ~ {{ row.endAt }}</template>
        </el-table-column>
        <el-table-column prop="reason" label="事由" min-width="240" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="status-pill pending">{{ formatLeaveStatus(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button text :loading="processingId === row.id" @click="decide(row.id, 'APPROVED')">通过</el-button>
            <el-button text :loading="processingId === row.id" @click="decide(row.id, 'REJECTED')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-empty v-if="approvals.length === 0" description="当前没有待你处理的审批事项" />
  </section>
</template>

<script setup lang="ts">
import { useApprovalsInboxPage } from "@/composables/approvals/useApprovalsInboxPage";
import { formatLeaveStatus, formatLeaveType } from "@/utils/display";

const { approvals, decide, processingId } = useApprovalsInboxPage();
</script>

<style scoped>
.table-page {
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
  max-width: 440px;
  margin: 0;
}

@media (max-width: 640px) {
  .section-head {
    flex-direction: column;
  }
}
</style>
