<!-- 请假申请页面：负责组装请假表单和最近申请记录。 -->
<template>
  <div class="page-grid">
    <section class="page-card form-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">请假流程</span>
          <h2 class="page-section-title">发起请假申请</h2>
        </div>
        <p class="page-section-caption">填写并提交。</p>
      </div>

      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-form-item label="请假类型" prop="leaveType" required>
          <el-select v-model="form.leaveType" placeholder="请选择请假类型">
            <el-option label="年假" value="ANNUAL" />
            <el-option label="病假" value="SICK" />
            <el-option label="事假" value="PERSONAL" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="startAt" required>
          <el-date-picker v-model="form.startAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择开始时间" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endAt" required>
          <el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择结束时间" />
        </el-form-item>
        <el-form-item label="请假事由" prop="reason" required>
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请简要描述请假原因与交接说明" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">提交请假申请</el-button>
      </el-form>
    </section>

    <section class="page-card">
      <div class="section-head compact">
        <div>
          <span class="page-kicker">最近申请</span>
          <h2 class="page-section-title">最近申请</h2>
        </div>
        <p class="page-section-caption">最近记录。</p>
      </div>

      <div v-if="recentRequests.length" class="recent-list">
        <article v-for="item in recentRequests" :key="item.id" class="recent-item">
          <div class="recent-row">
            <strong>{{ formatLeaveType(item.leaveType) }}</strong>
            <span class="status-pill" :class="item.status.toLowerCase()">{{ formatLeaveStatus(item.status) }}</span>
          </div>
          <p>{{ formatDateTime(item.startAt) }} ~ {{ formatDateTime(item.endAt) }}</p>
        </article>
      </div>
      <el-empty v-else description="最近还没有请假申请记录" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useLeaveRequestPage } from "@/composables/leave/useLeaveRequestPage";
import { formatDateTime, formatLeaveStatus, formatLeaveType } from "@/utils/display";

const { form, recentRequests, rules, setFormRef, submit, submitting } = useLeaveRequestPage();
</script>

<style scoped>
.page-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
}

.form-card {
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
  max-width: 360px;
  margin: 0;
}

.recent-list {
  display: grid;
  gap: 12px;
}

.recent-item {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(125, 148, 171, 0.14);
}

.recent-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.recent-item p {
  margin: 10px 0 0;
  color: var(--app-text-tertiary);
  font-size: 13px;
}

@media (max-width: 960px) {
  .page-grid {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
  }
}
</style>
