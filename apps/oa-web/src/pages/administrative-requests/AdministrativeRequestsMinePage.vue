<!-- 我的行政申请页面：负责展示筛选后的申请列表，并支持抽屉查看详情。 -->
<template>
  <section class="page-shell">
    <section class="page-card filter-card">
      <div class="section-head">
        <div>
          <span class="page-kicker">申请跟踪</span>
          <h2 class="page-section-title">我的行政申请</h2>
        </div>
        <p class="page-section-caption">查看报销、出差、采购和用印申请的最新进度。</p>
      </div>

      <div class="filter-toolbar">
        <el-select v-model="filters.type" clearable placeholder="全部类型" size="small" class="filter-field">
          <el-option
            v-for="item in typeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="全部状态" size="small" class="filter-field">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" size="small" :loading="isLoading" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <div v-if="requests.length" class="request-list">
      <article v-for="item in requests" :key="item.id" class="page-card request-card">
        <div class="request-top">
          <div>
            <span class="request-no">{{ item.requestNo }}</span>
            <h3>{{ item.title }}</h3>
          </div>
          <span class="status-pill" :class="item.status.toLowerCase()">
            {{ formatAdministrativeRequestStatus(item.status) }}
          </span>
        </div>

        <div class="request-tags">
          <el-tag size="small" type="info" effect="plain" round>{{ formatAdministrativeRequestType(item.type) }}</el-tag>
          <el-tag v-if="item.attachmentNames.length" size="small" effect="plain" round>附件 {{ item.attachmentNames.length }}</el-tag>
        </div>

        <p class="request-summary">{{ item.summary }}</p>
        <p class="request-reason">{{ item.reason }}</p>

        <div class="request-meta">
          <span>审批人：{{ item.approverName || "待分配" }}</span>
          <span>最近意见：{{ item.latestComment || "暂无" }}</span>
          <span>提交时间：{{ formatDateTime(item.submittedAt) }}</span>
        </div>

        <div class="request-actions">
          <el-button text @click="openAdministrativeRequestDetail(item.id)">查看详情</el-button>
          <el-button
            v-if="item.status === 'PENDING'"
            text
            :loading="processingId === item.id"
            @click="handleCancelRequest(item)"
          >
            撤回申请
          </el-button>
        </div>
      </article>
    </div>

    <section v-else-if="!isLoading" class="page-card">
      <el-empty description="当前筛选条件下没有行政申请" />
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
import { ElMessageBox } from "element-plus";
import { computed } from "vue";

import { useAdministrativeRequestCollectionPage } from "@/composables/administrative-requests/useAdministrativeRequestCollectionPage";
import { useAdministrativeRequestDetailDrawer } from "@/composables/administrative-requests/useAdministrativeRequestDetailDrawer";
import AdministrativeRequestDetailDrawer from "@/pages/administrative-requests/components/AdministrativeRequestDetailDrawer.vue";
import type { AdministrativeRequestItem } from "@/types/office-automation";
import { formatAdministrativeRequestStatus, formatAdministrativeRequestType, formatDateTime } from "@/utils/display";

const { cancelRequest, filters, isLoading, loadData, processingId, requests, resetFilters } =
  useAdministrativeRequestCollectionPage("mine");
const {
  drawerVisible,
  isLoading: isRequestLoading,
  isTabletOrDown,
  openAdministrativeRequestDetail,
  request
} = useAdministrativeRequestDetailDrawer();

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

async function handleCancelRequest(requestItem: AdministrativeRequestItem): Promise<void> {
  if (requestItem.status !== "PENDING") {
    return;
  }

  try {
    await ElMessageBox.confirm(`确认撤回“${requestItem.title}”吗？`, "撤回行政申请", {
      type: "warning",
      confirmButtonText: "确认撤回",
      cancelButtonText: "取消"
    });
    await cancelRequest(requestItem);
  } catch {
    // 取消确认时不提示，避免打断当前列表浏览。
  }
}
</script>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.filter-card {
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
  width: fit-content;
  max-width: 100%;
}

.filter-field {
  width: 188px;
}

.filter-field :deep(.el-select__wrapper),
.filter-actions :deep(.el-button) {
  min-height: 36px;
}

.filter-actions {
  display: inline-flex;
  gap: 8px;
}

.request-list {
  display: grid;
  gap: 14px;
}

.request-card {
  display: grid;
  gap: 14px;
}

.request-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.request-no {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--app-text-tertiary);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.request-top h3,
.request-summary,
.request-reason {
  margin: 0;
}

.request-top h3 {
  font-size: 20px;
}

.request-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.request-summary {
  color: var(--app-text-secondary);
}

.request-reason {
  color: var(--app-text-primary);
  line-height: 1.7;
}

.request-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--app-text-secondary);
  font-size: 12px;
}

.request-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .section-head,
  .request-top {
    flex-direction: column;
  }

  .filter-toolbar {
    width: 100%;
  }

  .filter-field {
    flex: 1 1 160px;
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
