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
        <div class="toolbar-row">
          <p>认证、分配、转换和修改动作都会进入日志列表，便于追溯。</p>
          <el-input v-model="auditFilter.actorName" placeholder="按操作人筛选" class="filter-input" @change="loadAuditLogs" />
        </div>

        <div class="page-table-shell">
          <el-table :data="auditLogs" border>
            <el-table-column prop="actorName" label="操作人" min-width="160" />
            <el-table-column prop="actionType" label="动作" min-width="140" />
            <el-table-column prop="targetType" label="对象类型" min-width="140" />
            <el-table-column prop="targetId" label="对象 ID" min-width="220" />
            <el-table-column prop="createdAt" label="时间" min-width="180" />
          </el-table>
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
import { nextTick, onMounted, reactive, ref } from "vue";

import { http } from "../api/http";
import type { AuditLog, DictionaryEntry } from "../types/entities";
import { normalizeOptionalTextForCreate, normalizeOptionalTextForUpdate, normalizeRequiredText } from "../utils/form";
import { getRequestErrorMessage, validateForm } from "../utils/request";

const dictionaryEntries = ref<DictionaryEntry[]>([]);
const auditLogs = ref<AuditLog[]>([]);

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
  actorName: ""
});

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
    const { data } = await http.get<AuditLog[]>("/audit-logs", {
      params: {
        actorName: auditFilter.actorName || undefined
      }
    });
    auditLogs.value = data;
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

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}

@media (max-width: 960px) {
  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
