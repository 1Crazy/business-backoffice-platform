<template>
  <div class="page-stack">
    <section class="reminder-grid">
      <article class="page-card reminder-summary">
        <span>待办提醒</span>
        <strong>{{ reminders.length }}</strong>
        <p>按当前权限范围汇总，还未处理的线索/客户提醒都会显示在这里。</p>
      </article>
      <section class="page-card reminder-list">
        <div class="list-head">
          <h3>最近提醒</h3>
          <el-button text @click="loadReminders">刷新</el-button>
        </div>
        <el-empty v-if="!reminders.length" description="暂无待办提醒" />
        <ul v-else>
          <li v-for="item in reminders.slice(0, 5)" :key="item.id">
            <span>{{ item.owner?.displayName ?? "-" }}</span>
            <strong>{{ item.lead?.name ?? item.customer?.name ?? "未命名记录" }}</strong>
            <small>{{ item.remindAt }}</small>
          </li>
        </ul>
      </section>
    </section>

    <section class="page-card filter-card">
      <el-form class="filter-form" label-position="top">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="线索名 / 联系人 / 手机" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" clearable placeholder="全部来源">
            <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option v-for="item in leadStatuses" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="归属人">
          <el-select v-model="filters.ownerId" clearable placeholder="全部归属人">
            <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="toolbar-row">
        <p>线索页把“分配、转化、跟进、提醒”压缩到一条工作路径里，减少销售切换页面的次数。</p>
        <div class="toolbar-actions">
          <el-button @click="loadLeads">刷新</el-button>
          <el-button type="primary" @click="openLeadDialog()">新增线索</el-button>
        </div>
      </div>
    </section>

    <section class="page-card">
      <div class="page-table-shell">
        <el-table :data="leads" border>
          <el-table-column prop="name" label="线索名称" min-width="180" />
          <el-table-column prop="contactName" label="联系人" min-width="120" />
          <el-table-column prop="phone" label="手机号" min-width="140" />
          <el-table-column prop="source" label="来源" min-width="120" />
          <el-table-column prop="status" label="状态" min-width="120" />
          <el-table-column label="归属人" min-width="120">
            <template #default="{ row }">
              {{ row.owner?.displayName ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="转化结果" min-width="180">
            <template #default="{ row }">
              {{ row.convertedCustomer?.name ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="340" :fixed="isDesktop ? 'right' : false">
            <template #default="{ row }">
              <el-button text @click="openLeadDialog(row)">编辑</el-button>
              <el-button text @click="openOwnerDialog(row)">分配</el-button>
              <el-button text :disabled="row.status === 'CONVERTED'" @click="convertLead(row)">转客户</el-button>
              <el-button text @click="openFollowUpDrawer(row)">跟进</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog
      v-model="leadDialogVisible"
      :title="leadForm.id ? '编辑线索' : '新增线索'"
      width="720px"
      class="entity-dialog"
    >
      <el-form
        ref="leadFormRef"
        :model="leadForm"
        :rules="leadRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="线索名称" prop="name" required>
              <el-input v-model="leadForm.name" placeholder="请输入线索名称" maxlength="36" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="leadForm.contactName" placeholder="选填，便于后续联系" maxlength="24" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="leadForm.phone" placeholder="选填，支持后续搜索与去重" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="来源" prop="source">
              <el-select v-model="leadForm.source" clearable class="full-width" placeholder="请选择线索来源">
                <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" v-if="leadForm.id">
            <el-form-item label="状态" prop="status">
              <el-select v-model="leadForm.status" class="full-width" placeholder="请选择线索状态">
                <el-option v-for="item in leadStatuses" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="归属人" prop="ownerId" required>
              <el-select v-model="leadForm.ownerId" class="full-width" placeholder="请选择归属人">
                <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="leadForm.notes" type="textarea" :rows="3" placeholder="选填，记录线索情况与背景" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitLead">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ownerDialogVisible" title="分配线索" width="460px" class="entity-dialog">
      <el-form
        ref="ownerFormRef"
        :model="ownerForm"
        :rules="ownerRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-form-item label="新归属人" prop="ownerId" required>
          <el-select v-model="ownerForm.ownerId" class="full-width" placeholder="请选择新的归属人">
            <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ownerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitOwner">确认分配</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="followUpDrawerVisible" :size="isTabletOrDown ? '100%' : '58%'" :title="selectedLead?.name ?? '线索跟进'">
      <div class="drawer-stack">
        <section class="page-card">
          <h3>跟进记录</h3>
          <el-timeline>
            <el-timeline-item v-for="item in followUps" :key="item.id" :timestamp="item.createdAt">
              <strong>{{ item.createdBy?.displayName }}</strong>
              <p>{{ item.content }}</p>
              <small v-if="item.reminder">提醒时间：{{ item.reminder.remindAt }}</small>
            </el-timeline-item>
          </el-timeline>
        </section>

        <section class="page-card">
          <h3>新增跟进</h3>
          <el-form
            ref="followUpFormRef"
            :model="followUpForm"
            :rules="followUpRules"
            label-position="top"
            require-asterisk-position="right"
            status-icon
            class="dialog-form"
          >
            <el-form-item label="跟进内容" prop="content" required>
              <el-input v-model="followUpForm.content" type="textarea" :rows="3" placeholder="请输入本次跟进内容" />
            </el-form-item>
            <el-form-item label="下次跟进时间" prop="nextFollowUpAt">
              <el-date-picker
                v-model="followUpForm.nextFollowUpAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss.SSS[Z]"
                class="full-width"
              />
            </el-form-item>
            <el-button type="primary" @click="submitFollowUp">保存跟进</el-button>
          </el-form>
        </section>

        <section class="page-card" v-if="selectedLead">
          <RecordUploadPanel business-type="LEAD" :business-id="selectedLead.id" />
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { nextTick, onMounted, reactive, ref, watch } from "vue";

import { http } from "../api/http";
import RecordUploadPanel from "../components/RecordUploadPanel.vue";
import { useViewport } from "../composables/useViewport";
import type { DictionaryEntry, FollowUp, Lead, User } from "../types/entities";
import { normalizeOptionalTextForCreate, normalizeOptionalTextForUpdate, normalizeRequiredText } from "../utils/form";
import { getRequestErrorMessage, validateForm } from "../utils/request";

interface PendingReminder {
  id: string;
  remindAt: string;
  owner?: User;
  lead?: Lead | null;
  customer?: { name: string } | null;
}

const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"];

const leads = ref<Lead[]>([]);
const users = ref<User[]>([]);
const reminders = ref<PendingReminder[]>([]);
const sourceOptions = ref<DictionaryEntry[]>([]);
const followUps = ref<FollowUp[]>([]);

const leadDialogVisible = ref(false);
const ownerDialogVisible = ref(false);
const followUpDrawerVisible = ref(false);
const selectedLead = ref<Lead | null>(null);

const leadFormRef = ref<FormInstance>();
const ownerFormRef = ref<FormInstance>();
const followUpFormRef = ref<FormInstance>();

const filters = reactive({
  keyword: "",
  source: "",
  status: "",
  ownerId: ""
});

const { isDesktop, isTabletOrDown } = useViewport();

const leadForm = reactive({
  id: "",
  name: "",
  contactName: "",
  phone: "",
  source: "",
  status: "NEW",
  ownerId: "",
  notes: ""
});

const ownerForm = reactive({
  ownerId: ""
});

const followUpForm = reactive({
  content: "",
  nextFollowUpAt: ""
});

const leadRules: FormRules<typeof leadForm> = {
  name: [
    { required: true, message: "请输入线索名称", trigger: "blur" },
    { min: 2, message: "线索名称至少需要 2 个字符", trigger: "blur" }
  ],
  ownerId: [{ required: true, message: "请选择归属人", trigger: "change" }]
};

const ownerRules: FormRules<typeof ownerForm> = {
  ownerId: [{ required: true, message: "请选择新的归属人", trigger: "change" }]
};

const followUpRules: FormRules<typeof followUpForm> = {
  content: [{ required: true, message: "请输入跟进内容", trigger: "blur" }]
};

async function loadMeta(): Promise<void> {
  try {
    const [userResponse, sourceResponse] = await Promise.all([
      http.get<User[]>("/users"),
      http.get<DictionaryEntry[]>("/dictionaries", {
        params: { type: "customer-source" }
      })
    ]);

    users.value = userResponse.data;
    sourceOptions.value = sourceResponse.data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索基础数据加载失败，请稍后重试。"));
  }
}

async function loadLeads(): Promise<void> {
  try {
    const { data } = await http.get<Lead[]>("/leads", {
      params: {
        keyword: filters.keyword || undefined,
        source: filters.source || undefined,
        status: filters.status || undefined,
        ownerId: filters.ownerId || undefined
      }
    });

    leads.value = data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索列表加载失败，请稍后重试。"));
  }
}

async function loadReminders(): Promise<void> {
  try {
    const { data } = await http.get<PendingReminder[]>("/leads/reminders");
    reminders.value = data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "提醒列表加载失败，请稍后重试。"));
  }
}

function resetLeadForm(): void {
  leadForm.id = "";
  leadForm.name = "";
  leadForm.contactName = "";
  leadForm.phone = "";
  leadForm.source = "";
  leadForm.status = "NEW";
  leadForm.ownerId = users.value[0]?.id ?? "";
  leadForm.notes = "";
}

async function openLeadDialog(lead?: Lead): Promise<void> {
  if (!lead) {
    resetLeadForm();
  } else {
    leadForm.id = lead.id;
    leadForm.name = lead.name;
    leadForm.contactName = lead.contactName ?? "";
    leadForm.phone = lead.phone ?? "";
    leadForm.source = lead.source ?? "";
    leadForm.status = lead.status;
    leadForm.ownerId = lead.ownerId;
    leadForm.notes = lead.notes ?? "";
  }

  leadDialogVisible.value = true;
  await nextTick();
  leadFormRef.value?.clearValidate();
}

async function submitLead(): Promise<void> {
  const isValid = await validateForm(leadFormRef.value);
  if (!isValid) {
    return;
  }

  const createPayload = {
    name: normalizeRequiredText(leadForm.name),
    contactName: normalizeOptionalTextForCreate(leadForm.contactName),
    phone: normalizeOptionalTextForCreate(leadForm.phone),
    source: normalizeOptionalTextForCreate(leadForm.source),
    ownerId: normalizeRequiredText(leadForm.ownerId),
    notes: normalizeOptionalTextForCreate(leadForm.notes)
  };
  const updatePayload = {
    name: normalizeRequiredText(leadForm.name),
    contactName: normalizeOptionalTextForUpdate(leadForm.contactName),
    phone: normalizeOptionalTextForUpdate(leadForm.phone),
    source: normalizeOptionalTextForUpdate(leadForm.source),
    status: normalizeOptionalTextForCreate(leadForm.status),
    ownerId: normalizeRequiredText(leadForm.ownerId),
    notes: normalizeOptionalTextForUpdate(leadForm.notes)
  };

  try {
    if (leadForm.id) {
      await http.patch(`/leads/${leadForm.id}`, updatePayload);
    } else {
      await http.post("/leads", createPayload);
    }

    leadDialogVisible.value = false;
    ElMessage.success("线索已保存。");
    await Promise.all([loadLeads(), loadReminders()]);
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索保存失败，请检查表单后重试。"));
  }
}

async function openOwnerDialog(lead: Lead): Promise<void> {
  selectedLead.value = lead;
  ownerForm.ownerId = lead.ownerId;
  ownerDialogVisible.value = true;
  await nextTick();
  ownerFormRef.value?.clearValidate();
}

async function submitOwner(): Promise<void> {
  if (!selectedLead.value) {
    return;
  }

  const isValid = await validateForm(ownerFormRef.value);
  if (!isValid) {
    return;
  }

  try {
    await http.patch(`/leads/${selectedLead.value.id}/owner`, {
      ownerId: normalizeRequiredText(ownerForm.ownerId)
    });
    ownerDialogVisible.value = false;
    ElMessage.success("线索分配已更新。");
    await loadLeads();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索分配失败，请稍后重试。"));
  }
}

async function convertLead(lead: Lead): Promise<void> {
  try {
    await http.post(`/leads/${lead.id}/convert`);
    ElMessage.success("线索已成功转为客户。");
    await Promise.all([loadLeads(), loadReminders()]);
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索转客户失败，请稍后重试。"));
  }
}

async function openFollowUpDrawer(lead: Lead): Promise<void> {
  try {
    const [detailResponse, followUpResponse] = await Promise.all([
      http.get<Lead>(`/leads/${lead.id}`),
      http.get<FollowUp[]>(`/leads/${lead.id}/follow-ups`)
    ]);

    selectedLead.value = detailResponse.data;
    followUps.value = followUpResponse.data;
    followUpForm.content = "";
    followUpForm.nextFollowUpAt = "";
    followUpDrawerVisible.value = true;
    await nextTick();
    followUpFormRef.value?.clearValidate();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索跟进数据加载失败，请稍后重试。"));
  }
}

async function submitFollowUp(): Promise<void> {
  if (!selectedLead.value) {
    return;
  }

  const isValid = await validateForm(followUpFormRef.value);
  if (!isValid) {
    return;
  }

  try {
    await http.post(`/leads/${selectedLead.value.id}/follow-ups`, {
      content: normalizeRequiredText(followUpForm.content),
      nextFollowUpAt: normalizeOptionalTextForCreate(followUpForm.nextFollowUpAt)
    });

    followUpForm.content = "";
    followUpForm.nextFollowUpAt = "";
    ElMessage.success("线索跟进已保存。");
    const { data } = await http.get<FollowUp[]>(`/leads/${selectedLead.value.id}/follow-ups`);
    followUps.value = data;
    await loadReminders();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "线索跟进保存失败，请稍后重试。"));
  }
}

watch(
  () => [filters.keyword, filters.source, filters.status, filters.ownerId],
  () => {
    void loadLeads();
  }
);

onMounted(async () => {
  await loadMeta();
  resetLeadForm();
  await Promise.all([loadLeads(), loadReminders()]);
});
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}

.reminder-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
}

.reminder-summary {
  display: grid;
  gap: 10px;
}

.reminder-summary span {
  color: #64748b;
}

.reminder-summary strong {
  font-size: 36px;
  color: #0f172a;
}

.reminder-summary p {
  margin: 0;
  color: #64748b;
  line-height: 1.8;
}

.reminder-list ul {
  margin: 0;
  padding-left: 18px;
}

.reminder-list li {
  margin-bottom: 10px;
  color: #334155;
}

.reminder-list span,
.reminder-list small {
  display: block;
  color: #64748b;
}

.list-head,
.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.filter-card {
  display: grid;
  gap: 16px;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
}

.toolbar-row p {
  margin: 0;
  color: #64748b;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.drawer-stack {
  display: grid;
  gap: 16px;
}

.full-width {
  width: 100%;
}

.filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 14px;
}

.filter-form :deep(.el-form-item__content),
.filter-form :deep(.el-input),
.filter-form :deep(.el-select) {
  width: 100%;
}

@media (max-width: 960px) {
  .reminder-grid {
    grid-template-columns: 1fr;
  }

  .filter-form {
    grid-template-columns: 1fr;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions {
    justify-content: stretch;
  }

  .toolbar-actions :deep(.el-button) {
    flex: 1 1 140px;
  }
}
</style>
