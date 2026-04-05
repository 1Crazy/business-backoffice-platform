<template>
  <section class="page-card system-page">
    <el-tabs>
      <el-tab-pane label="字典配置">
        <div class="toolbar-row">
          <p>客户来源、客户状态等字段通过字典驱动，避免业务表单硬编码。</p>
          <el-button type="primary" @click="openDictionaryDialog()">新增字典项</el-button>
        </div>

        <div class="page-table-shell">
          <el-table :data="dictionaryEntries" border>
            <el-table-column prop="type" label="类型" min-width="160" />
            <el-table-column prop="label" label="标签" min-width="160" />
            <el-table-column prop="value" label="值" min-width="160" />
            <el-table-column prop="sort" label="排序" width="100" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                {{ row.enabled ? "启用" : "停用" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button text @click="openDictionaryDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="审计日志">
        <el-form class="audit-filter-form" label-position="top">
          <el-form-item label="操作人">
            <el-input v-model="auditFilter.actorName" placeholder="按操作人筛选" class="filter-input" />
          </el-form-item>
          <el-form-item label="动作类型">
            <el-select v-model="auditFilter.actionType" clearable placeholder="全部动作">
              <el-option v-for="item in auditActionOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="对象类型">
            <el-select v-model="auditFilter.targetType" clearable placeholder="全部对象">
              <el-option v-for="item in auditTargetTypeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="auditFilter.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="full-width"
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-select v-model="auditTableState.sortPreset" placeholder="选择排序方式">
              <el-option
                v-for="item in auditSortOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="toolbar-row">
          <p>认证、分配、转换和修改动作都会进入日志列表，筛选后仍保持服务端分页与时间口径一致。</p>
          <el-button @click="loadAuditLogs">刷新</el-button>
        </div>

        <div class="table-meta">
          <div>
            <span class="table-kicker">Audit Trail</span>
            <h3>审计结果</h3>
            <p>当前筛选下共 {{ auditTableState.total }} 条日志，便于按动作与时间区间快速追溯。</p>
          </div>
          <div class="meta-pill">第 {{ auditTableState.page }} / {{ Math.max(auditTableState.totalPages, 1) }} 页</div>
        </div>

        <div v-if="auditLogs.length" class="page-table-shell">
          <el-table :data="auditLogs" border>
            <el-table-column prop="actorName" label="操作人" min-width="160" />
            <el-table-column prop="actionType" label="动作" min-width="140" />
            <el-table-column prop="targetType" label="对象类型" min-width="140" />
            <el-table-column prop="targetId" label="对象 ID" min-width="220" />
            <el-table-column prop="createdAt" label="时间" min-width="180" />
          </el-table>
        </div>
        <el-empty v-else description="当前筛选条件下暂无审计日志" />

        <div class="pagination-row">
          <span class="pagination-caption">每页 {{ auditTableState.pageSize }} 条，当前排序：{{ currentAuditSortLabel }}</span>
          <el-pagination
            :current-page="auditTableState.page"
            :page-size="auditTableState.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="auditTableState.total"
            background
            layout="total, sizes, prev, pager, next"
            @current-change="handleAuditPageChange"
            @size-change="handleAuditPageSizeChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="dictionaryDialogVisible"
      :title="dictionaryForm.id ? '编辑字典项' : '新增字典项'"
      width="560px"
      class="entity-dialog"
    >
      <el-form
        ref="dictionaryFormRef"
        :model="dictionaryForm"
        :rules="dictionaryRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="类型" prop="type" required>
              <el-input v-model="dictionaryForm.type" placeholder="请输入类型，例如 customer-source" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="标签" prop="label" required>
              <el-input v-model="dictionaryForm.label" placeholder="请输入展示标签" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="值" prop="value" required>
              <el-input v-model="dictionaryForm.value" placeholder="请输入字典值" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="dictionaryForm.sort" :min="0" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="是否启用" prop="enabled">
          <el-switch v-model="dictionaryForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dictionaryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDictionary">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import { http } from "../api/http";
import type { AuditLog, DictionaryEntry, PaginatedResponse, SortOrder } from "../types/entities";
import { normalizeOptionalTextForCreate, normalizeOptionalTextForUpdate, normalizeRequiredText } from "../utils/form";
import { getRequestErrorMessage, validateForm } from "../utils/request";

const dictionaryEntries = ref<DictionaryEntry[]>([]);
const auditLogs = ref<AuditLog[]>([]);
const auditActionOptions = [
  "SIGN_IN",
  "SIGN_IN_FAILED",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ENABLE",
  "DISABLE",
  "ASSIGN",
  "CONVERT",
  "UPLOAD",
  "SESSION_REVOKE"
] as const;
const auditTargetTypeOptions = [
  "auth",
  "auth-session",
  "customer",
  "customer-tag",
  "customer-tags",
  "customer-followup",
  "lead",
  "lead-followup",
  "attachment"
] as const;
const auditSortOptions = [
  { value: "createdAt:desc", label: "最新日志", sortBy: "createdAt", sortOrder: "desc" },
  { value: "actionType:asc", label: "动作升序", sortBy: "actionType", sortOrder: "asc" },
  { value: "targetType:asc", label: "对象类型升序", sortBy: "targetType", sortOrder: "asc" }
] as const;

const dictionaryDialogVisible = ref(false);
const dictionaryFormRef = ref<FormInstance>();

const dictionaryForm = reactive({
  id: "",
  type: "",
  label: "",
  value: "",
  sort: 0,
  enabled: true
});

const dictionaryRules: FormRules<typeof dictionaryForm> = {
  type: [{ required: true, message: "请输入类型", trigger: "blur" }],
  label: [{ required: true, message: "请输入标签", trigger: "blur" }],
  value: [{ required: true, message: "请输入字典值", trigger: "blur" }]
};

const auditFilter = reactive({
  actorName: "",
  actionType: "",
  targetType: "",
  dateRange: [] as [string, string] | [] | null
});

const auditTableState = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "desc" as SortOrder,
  sortPreset: "createdAt:desc"
});

const currentAuditSortLabel = computed(
  () => auditSortOptions.find((item) => item.value === auditTableState.sortPreset)?.label ?? "最新日志"
);

async function loadDictionaries(): Promise<void> {
  try {
    const { data } = await http.get<DictionaryEntry[]>("/dictionaries");
    dictionaryEntries.value = data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "字典数据加载失败，请稍后重试。"));
  }
}

async function loadAuditLogs(): Promise<void> {
  try {
    const [startDate, endDate] = auditFilter.dateRange ?? [];
    const { data } = await http.get<PaginatedResponse<AuditLog>>("/audit-logs", {
      params: {
        actorName: auditFilter.actorName || undefined,
        actionType: auditFilter.actionType || undefined,
        targetType: auditFilter.targetType || undefined,
        startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
        page: auditTableState.page,
        pageSize: auditTableState.pageSize,
        sortBy: auditTableState.sortBy,
        sortOrder: auditTableState.sortOrder
      }
    });
    auditLogs.value = data.items;
    auditTableState.page = data.page;
    auditTableState.pageSize = data.pageSize;
    auditTableState.total = data.total;
    auditTableState.totalPages = data.totalPages;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "审计日志加载失败，请稍后重试。"));
  }
}

async function openDictionaryDialog(entry?: DictionaryEntry): Promise<void> {
  dictionaryForm.id = entry?.id ?? "";
  dictionaryForm.type = entry?.type ?? "";
  dictionaryForm.label = entry?.label ?? "";
  dictionaryForm.value = entry?.value ?? "";
  dictionaryForm.sort = entry?.sort ?? 0;
  dictionaryForm.enabled = entry?.enabled ?? true;
  dictionaryDialogVisible.value = true;
  await nextTick();
  dictionaryFormRef.value?.clearValidate();
}

async function submitDictionary(): Promise<void> {
  const isValid = await validateForm(dictionaryFormRef.value);
  if (!isValid) {
    return;
  }

  const createPayload = {
    type: normalizeRequiredText(dictionaryForm.type),
    label: normalizeRequiredText(dictionaryForm.label),
    value: normalizeRequiredText(dictionaryForm.value),
    sort: dictionaryForm.sort,
    enabled: dictionaryForm.enabled
  };
  const updatePayload = {
    type: normalizeRequiredText(dictionaryForm.type),
    label: normalizeRequiredText(dictionaryForm.label),
    value: normalizeRequiredText(dictionaryForm.value),
    sort: dictionaryForm.sort,
    enabled: dictionaryForm.enabled
  };

  try {
    if (dictionaryForm.id) {
      await http.patch(`/dictionaries/${dictionaryForm.id}`, updatePayload);
    } else {
      await http.post("/dictionaries", createPayload);
    }

    dictionaryDialogVisible.value = false;
    ElMessage.success("字典项已保存。");
    await loadDictionaries();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "字典项保存失败，请检查表单后重试。"));
  }
}

onMounted(() => {
  void Promise.all([loadDictionaries(), loadAuditLogs()]);
});

watch(
  () => [auditFilter.actorName, auditFilter.actionType, auditFilter.targetType, ...(auditFilter.dateRange ?? [])],
  () => {
    auditTableState.page = 1;
    void loadAuditLogs();
  }
);

watch(
  () => auditTableState.sortPreset,
  (value) => {
    const nextSort = auditSortOptions.find((item) => item.value === value) ?? auditSortOptions[0];

    auditTableState.sortBy = nextSort.sortBy;
    auditTableState.sortOrder = nextSort.sortOrder;
    auditTableState.page = 1;
    void loadAuditLogs();
  }
);

function handleAuditPageChange(page: number): void {
  auditTableState.page = page;
  void loadAuditLogs();
}

function handleAuditPageSizeChange(pageSize: number): void {
  auditTableState.pageSize = pageSize;
  auditTableState.page = 1;
  void loadAuditLogs();
}
</script>

<style scoped>
.system-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.toolbar-row p {
  margin: 0;
  min-width: 0;
  color: #64748b;
}

.filter-input,
.full-width {
  width: 100%;
}

.audit-filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
  margin-bottom: 16px;
}

.audit-filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.audit-filter-form :deep(.el-form-item__content),
.audit-filter-form :deep(.el-input),
.audit-filter-form :deep(.el-select),
.audit-filter-form :deep(.el-date-editor) {
  width: 100%;
}

.table-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.table-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.08);
  color: #1e40af;
  font-size: 12px;
  font-family: "Fira Code", monospace;
  letter-spacing: 0.04em;
}

.table-meta h3 {
  margin: 0 0 6px;
}

.table-meta p,
.pagination-caption {
  margin: 0;
  color: #64748b;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.08), rgba(245, 158, 11, 0.12));
  color: #1e3a8a;
  font-weight: 600;
  white-space: nowrap;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 16px;
}

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}

@media (max-width: 960px) {
  .toolbar-row,
  .table-meta,
  .pagination-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
