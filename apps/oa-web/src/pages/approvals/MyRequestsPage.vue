<!-- 我发起的申请页面：负责展示当前员工提交过的请假申请。 -->
<template>
  <section class="page-card">
    <h2 class="page-section-title">我发起的申请</h2>
    <p class="page-section-caption">在一个列表里查看自己发起过的请假申请、当前状态和最近审批反馈。</p>

    <div class="request-list" v-if="requests.length">
      <article v-for="item in requests" :key="item.id" class="request-item">
        <div class="request-header">
          <div>
            <strong>{{ item.leaveType }}</strong>
            <p>{{ item.startAt }} ~ {{ item.endAt }}</p>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">{{ item.status }}</span>
        </div>
        <p class="request-reason">{{ item.reason }}</p>
        <div class="request-meta">
          <span>当前审批人：{{ item.currentApproverName || "待系统分配" }}</span>
          <span>最近意见：{{ item.latestComment || "暂无" }}</span>
        </div>
      </article>
    </div>
    <el-empty v-else description="你还没有发起过请假申请" />
  </section>
</template>

<script setup lang="ts">
import { useMyRequestsPage } from "@/composables/approvals/useMyRequestsPage";

const { requests } = useMyRequestsPage();
</script>

<style scoped>
.request-list {
  display: grid;
  gap: 14px;
}

.request-item {
  padding: 16px 18px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.request-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.request-header p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
}

.request-reason {
  margin: 14px 0 0;
  color: #334155;
  line-height: 1.7;
}

.request-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 14px;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 640px) {
  .request-header {
    flex-direction: column;
  }
}
</style>
