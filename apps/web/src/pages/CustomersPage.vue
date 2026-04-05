<template>
  <div class="page-stack">
    <section class="page-card filter-card">
      <el-form class="filter-form" label-position="top">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="客户名 / 联系人 / 手机" clearable />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" clearable placeholder="全部来源">
            <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态">
            <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="归属人">
          <el-select v-model="filters.ownerId" clearable placeholder="全部归属人">
            <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="filters.tagId" clearable placeholder="全部标签">
            <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-select v-model="customerTableState.sortPreset" placeholder="选择排序方式">
            <el-option
              v-for="item in customerSortOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="toolbar-row">
        <p>把客户资料、标签、归属和跟进放在同一张工作台里，销售切换成本会更低。</p>
        <div class="toolbar-actions">
          <el-button @click="loadCustomers">刷新</el-button>
          <el-button @click="openTagDialog()">新建标签</el-button>
          <el-button type="primary" @click="openCustomerDialog()">新增客户</el-button>
        </div>
      </div>
    </section>

    <section class="page-card table-card">
      <div class="table-meta">
        <div>
          <span class="table-kicker">Customers / Scoped Query</span>
          <h3>客户结果</h3>
          <p>当前筛选与数据范围交叉后，共返回 {{ customerTableState.total }} 条客户记录。</p>
        </div>
        <div class="meta-pill">第 {{ customerTableState.page }} / {{ Math.max(customerTableState.totalPages, 1) }} 页</div>
      </div>

      <div v-if="customers.length" class="page-table-shell">
        <el-table :data="customers" border>
          <el-table-column prop="name" label="客户名称" min-width="180" />
          <el-table-column prop="contactName" label="联系人" min-width="120" />
          <el-table-column prop="phone" label="手机号" min-width="140" />
          <el-table-column prop="source" label="来源" min-width="120" />
          <el-table-column prop="status" label="状态" min-width="120" />
          <el-table-column label="归属人" min-width="120">
            <template #default="{ row }">
              {{ row.owner?.displayName ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="220">
            <template #default="{ row }">
              <el-tag
                v-for="item in row.tags"
                :key="item.tag.id"
                class="tag-item"
                :style="{ borderColor: item.tag.color ?? '#cbd5e1', color: item.tag.color ?? '#334155' }"
              >
                {{ item.tag.name }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" :fixed="isDesktop ? 'right' : false">
            <template #default="{ row }">
              <el-button text @click="openCustomerDialog(row)">编辑</el-button>
              <el-button text @click="openOwnerDialog(row)">转交</el-button>
              <el-button text @click="openFollowUpDrawer(row)">跟进</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="当前筛选和数据范围下暂无客户" />

      <div class="pagination-row">
        <span class="pagination-caption">每页 {{ customerTableState.pageSize }} 条，当前排序：{{ currentCustomerSortLabel }}</span>
        <el-pagination
          :current-page="customerTableState.page"
          :page-size="customerTableState.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="customerTableState.total"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="handleCustomerPageChange"
          @size-change="handleCustomerPageSizeChange"
        />
      </div>
    </section>

    <el-dialog
      v-model="customerDialogVisible"
      :title="customerForm.id ? '编辑客户' : '新增客户'"
      width="760px"
      class="entity-dialog"
    >
      <el-form
        ref="customerFormRef"
        :model="customerForm"
        :rules="customerRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="客户名称" prop="name" required>
              <el-input v-model="customerForm.name" placeholder="请输入客户名称" maxlength="36" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="customerForm.contactName" placeholder="选填，便于后续跟进" maxlength="24" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="customerForm.phone" placeholder="选填，支持后续搜索与去重" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="customerForm.email" placeholder="选填，示例：contact@example.com" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="来源" prop="source">
              <el-select v-model="customerForm.source" clearable class="full-width" placeholder="请选择客户来源">
                <el-option v-for="item in sourceOptions" :key="item.id" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="customerForm.status" clearable class="full-width" placeholder="请选择客户状态">
                <el-option v-for="item in statusOptions" :key="item.id" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="归属人" prop="ownerId" required>
              <el-select v-model="customerForm.ownerId" class="full-width" placeholder="请选择归属人">
                <el-option v-for="item in users" :key="item.id" :label="item.displayName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="标签" prop="tagIds">
              <el-select v-model="customerForm.tagIds" multiple class="full-width" clearable placeholder="可多选标签">
                <el-option v-for="item in tags" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="customerForm.notes" type="textarea" :rows="3" placeholder="选填，记录当前客户情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="customerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCustomer">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" title="新增标签" width="460px" class="entity-dialog">
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
      >
        <el-form-item label="标签名称" prop="name" required>
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" maxlength="16" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input v-model="tagForm.color" placeholder="#2563eb" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTag">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ownerDialogVisible" title="转交客户" width="460px" class="entity-dialog">
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
        <el-button type="primary" @click="submitOwner">确认转交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="followUpDrawerVisible" :size="isTabletOrDown ? '100%' : '58%'" :title="selectedCustomer?.name ?? '客户跟进'">
      <div class="drawer-stack">
        <section class="page-card">
          <div class="drawer-head">
            <div>
              <h3>跟进记录</h3>
              <p>记录沟通内容，并为下一步动作生成提醒。</p>
            </div>
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="item in followUps"
              :key="item.id"
              :timestamp="item.createdAt"
            >
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

        <section class="page-card" v-if="selectedCustomer">
          <RecordUploadPanel business-type="CUSTOMER" :business-id="selectedCustomer.id" />
        </section>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";

import { http } from "../api/http";
import RecordUploadPanel from "../components/RecordUploadPanel.vue";
import { useViewport } from "../composables/useViewport";
import type {
  Customer,
  CustomerTag,
  DictionaryEntry,
  FollowUp,
  PaginatedResponse,
  SortOrder,
  User
} from "../types/entities";
import {
  normalizeOptionalArray,
  normalizeOptionalTextForCreate,
  normalizeOptionalTextForUpdate,
  normalizeRequiredText
} from "../utils/form";
import { getRequestErrorMessage, validateForm } from "../utils/request";

const customers = ref<Customer[]>([]);
const users = ref<User[]>([]);
const tags = ref<CustomerTag[]>([]);
const sourceOptions = ref<DictionaryEntry[]>([]);
const statusOptions = ref<DictionaryEntry[]>([]);
const followUps = ref<FollowUp[]>([]);

const customerDialogVisible = ref(false);
const tagDialogVisible = ref(false);
const ownerDialogVisible = ref(false);
const followUpDrawerVisible = ref(false);

const selectedCustomer = ref<Customer | null>(null);

const customerFormRef = ref<FormInstance>();
const tagFormRef = ref<FormInstance>();
const ownerFormRef = ref<FormInstance>();
const followUpFormRef = ref<FormInstance>();

const filters = reactive({
  keyword: "",
  source: "",
  status: "",
  ownerId: "",
  tagId: ""
});

const customerSortOptions = [
  { value: "createdAt:desc", label: "最新创建", sortBy: "createdAt", sortOrder: "desc" },
  { value: "updatedAt:desc", label: "最近更新", sortBy: "updatedAt", sortOrder: "desc" },
  { value: "name:asc", label: "名称 A-Z", sortBy: "name", sortOrder: "asc" },
  { value: "status:asc", label: "状态升序", sortBy: "status", sortOrder: "asc" }
] as const;

const customerTableState = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  sortBy: "createdAt",
  sortOrder: "desc" as SortOrder,
  sortPreset: "createdAt:desc"
});

const { isDesktop, isTabletOrDown } = useViewport();

const currentCustomerSortLabel = computed(
  () => customerSortOptions.find((item) => item.value === customerTableState.sortPreset)?.label ?? "最新创建"
);

const customerForm = reactive({
  id: "",
  name: "",
  contactName: "",
  phone: "",
  email: "",
  source: "",
  status: "",
  ownerId: "",
  notes: "",
  tagIds: [] as string[]
});

const tagForm = reactive({
  name: "",
  color: "#2563eb"
});

const ownerForm = reactive({
  ownerId: ""
});

const followUpForm = reactive({
  content: "",
  nextFollowUpAt: ""
});

const customerRules: FormRules<typeof customerForm> = {
  name: [
    { required: true, message: "请输入客户名称", trigger: "blur" },
    { min: 2, message: "客户名称至少需要 2 个字符", trigger: "blur" }
  ],
  ownerId: [{ required: true, message: "请选择归属人", trigger: "change" }],
  email: [{ type: "email", message: "请输入正确的邮箱格式", trigger: "blur" }]
};

const tagRules: FormRules<typeof tagForm> = {
  name: [{ required: true, message: "请输入标签名称", trigger: "blur" }]
};

const ownerRules: FormRules<typeof ownerForm> = {
  ownerId: [{ required: true, message: "请选择新的归属人", trigger: "change" }]
};

const followUpRules: FormRules<typeof followUpForm> = {
  content: [{ required: true, message: "请输入跟进内容", trigger: "blur" }]
};

function resetCustomerForm(): void {
  customerForm.id = "";
  customerForm.name = "";
  customerForm.contactName = "";
  customerForm.phone = "";
  customerForm.email = "";
  customerForm.source = "";
  customerForm.status = "";
  customerForm.ownerId = users.value[0]?.id ?? "";
  customerForm.notes = "";
  customerForm.tagIds = [];
}

function resetTagForm(): void {
  tagForm.name = "";
  tagForm.color = "#2563eb";
}

async function loadMeta(): Promise<void> {
  try {
    const [userResponse, tagResponse, sourceResponse, statusResponse] = await Promise.all([
      http.get<User[]>("/users"),
      http.get<CustomerTag[]>("/customers/tags"),
      http.get<DictionaryEntry[]>("/dictionaries", {
        params: { type: "customer-source" }
      }),
      http.get<DictionaryEntry[]>("/dictionaries", {
        params: { type: "customer-status" }
      })
    ]);

    users.value = userResponse.data;
    tags.value = tagResponse.data;
    sourceOptions.value = sourceResponse.data;
    statusOptions.value = statusResponse.data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "客户基础数据加载失败，请稍后重试。"));
  }
}

async function loadCustomers(): Promise<void> {
  try {
    const { data } = await http.get<PaginatedResponse<Customer>>("/customers", {
      params: {
        keyword: filters.keyword || undefined,
        source: filters.source || undefined,
        status: filters.status || undefined,
        ownerId: filters.ownerId || undefined,
        tagId: filters.tagId || undefined,
        page: customerTableState.page,
        pageSize: customerTableState.pageSize,
        sortBy: customerTableState.sortBy,
        sortOrder: customerTableState.sortOrder
      }
    });

    customers.value = data.items;
    customerTableState.page = data.page;
    customerTableState.pageSize = data.pageSize;
    customerTableState.total = data.total;
    customerTableState.totalPages = data.totalPages;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "客户列表加载失败，请稍后重试。"));
  }
}

async function openCustomerDialog(customer?: Customer): Promise<void> {
  if (!customer) {
    resetCustomerForm();
  } else {
    customerForm.id = customer.id;
    customerForm.name = customer.name;
    customerForm.contactName = customer.contactName ?? "";
    customerForm.phone = customer.phone ?? "";
    customerForm.email = customer.email ?? "";
    customerForm.source = customer.source ?? "";
    customerForm.status = customer.status ?? "";
    customerForm.ownerId = customer.ownerId;
    customerForm.notes = customer.notes ?? "";
    customerForm.tagIds = customer.tags.map((item) => item.tag.id);
  }

  customerDialogVisible.value = true;
  await nextTick();
  customerFormRef.value?.clearValidate();
}

async function openTagDialog(): Promise<void> {
  resetTagForm();
  tagDialogVisible.value = true;
  await nextTick();
  tagFormRef.value?.clearValidate();
}

async function submitCustomer(): Promise<void> {
  const isValid = await validateForm(customerFormRef.value);
  if (!isValid) {
    return;
  }

  const createPayload = {
    name: normalizeRequiredText(customerForm.name),
    contactName: normalizeOptionalTextForCreate(customerForm.contactName),
    phone: normalizeOptionalTextForCreate(customerForm.phone),
    email: normalizeOptionalTextForCreate(customerForm.email),
    source: normalizeOptionalTextForCreate(customerForm.source),
    status: normalizeOptionalTextForCreate(customerForm.status),
    ownerId: normalizeRequiredText(customerForm.ownerId),
    notes: normalizeOptionalTextForCreate(customerForm.notes),
    tagIds: normalizeOptionalArray(customerForm.tagIds)
  };
  const updatePayload = {
    name: normalizeRequiredText(customerForm.name),
    contactName: normalizeOptionalTextForUpdate(customerForm.contactName),
    phone: normalizeOptionalTextForUpdate(customerForm.phone),
    email: normalizeOptionalTextForUpdate(customerForm.email),
    source: normalizeOptionalTextForUpdate(customerForm.source),
    status: normalizeOptionalTextForUpdate(customerForm.status),
    ownerId: normalizeRequiredText(customerForm.ownerId),
    notes: normalizeOptionalTextForUpdate(customerForm.notes),
    tagIds: customerForm.tagIds.map((item) => item.trim()).filter(Boolean)
  };

  try {
    if (customerForm.id) {
      await http.patch(`/customers/${customerForm.id}`, updatePayload);
    } else {
      await http.post("/customers", createPayload);
    }

    customerDialogVisible.value = false;
    ElMessage.success("客户已保存。");
    await loadCustomers();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "客户保存失败，请检查表单后重试。"));
  }
}

async function submitTag(): Promise<void> {
  const isValid = await validateForm(tagFormRef.value);
  if (!isValid) {
    return;
  }

  try {
    await http.post("/customers/tags", {
      name: normalizeRequiredText(tagForm.name),
      color: normalizeOptionalTextForCreate(tagForm.color)
    });

    tagDialogVisible.value = false;
    resetTagForm();
    ElMessage.success("标签已创建。");
    await loadMeta();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "标签创建失败，请稍后重试。"));
  }
}

async function openOwnerDialog(customer: Customer): Promise<void> {
  selectedCustomer.value = customer;
  ownerForm.ownerId = customer.ownerId;
  ownerDialogVisible.value = true;
  await nextTick();
  ownerFormRef.value?.clearValidate();
}

async function submitOwner(): Promise<void> {
  if (!selectedCustomer.value) {
    return;
  }

  const isValid = await validateForm(ownerFormRef.value);
  if (!isValid) {
    return;
  }

  try {
    await http.patch(`/customers/${selectedCustomer.value.id}/owner`, {
      ownerId: normalizeRequiredText(ownerForm.ownerId)
    });
    ownerDialogVisible.value = false;
    ElMessage.success("客户已转交。");
    await loadCustomers();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "客户转交失败，请稍后重试。"));
  }
}

async function openFollowUpDrawer(customer: Customer): Promise<void> {
  try {
    const [detailResponse, followUpResponse] = await Promise.all([
      http.get<Customer>(`/customers/${customer.id}`),
      http.get<FollowUp[]>(`/customers/${customer.id}/follow-ups`)
    ]);

    selectedCustomer.value = detailResponse.data;
    followUps.value = followUpResponse.data;
    followUpForm.content = "";
    followUpForm.nextFollowUpAt = "";
    followUpDrawerVisible.value = true;
    await nextTick();
    followUpFormRef.value?.clearValidate();
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "客户跟进数据加载失败，请稍后重试。"));
  }
}

async function submitFollowUp(): Promise<void> {
  if (!selectedCustomer.value) {
    return;
  }

  const isValid = await validateForm(followUpFormRef.value);
  if (!isValid) {
    return;
  }

  try {
    await http.post(`/customers/${selectedCustomer.value.id}/follow-ups`, {
      content: normalizeRequiredText(followUpForm.content),
      nextFollowUpAt: normalizeOptionalTextForCreate(followUpForm.nextFollowUpAt)
    });

    followUpForm.content = "";
    followUpForm.nextFollowUpAt = "";
    ElMessage.success("跟进已记录。");
    const { data } = await http.get<FollowUp[]>(`/customers/${selectedCustomer.value.id}/follow-ups`);
    followUps.value = data;
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "跟进保存失败，请稍后重试。"));
  }
}

watch(
  () => [filters.keyword, filters.source, filters.status, filters.ownerId, filters.tagId],
  () => {
    customerTableState.page = 1;
    void loadCustomers();
  }
);

watch(
  () => customerTableState.sortPreset,
  (value) => {
    const nextSort = customerSortOptions.find((item) => item.value === value) ?? customerSortOptions[0];

    customerTableState.sortBy = nextSort.sortBy;
    customerTableState.sortOrder = nextSort.sortOrder;
    customerTableState.page = 1;
    void loadCustomers();
  }
);

function handleCustomerPageChange(page: number): void {
  customerTableState.page = page;
  void loadCustomers();
}

function handleCustomerPageSizeChange(pageSize: number): void {
  customerTableState.pageSize = pageSize;
  customerTableState.page = 1;
  void loadCustomers();
}

onMounted(async () => {
  await loadMeta();
  resetCustomerForm();
  await loadCustomers();
});
</script>

<style scoped>
.page-stack {
  display: grid;
  gap: 20px;
}

.filter-card {
  display: grid;
  gap: 16px;
}

.table-card {
  display: grid;
  gap: 16px;
}

.filter-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.table-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
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

.tag-item {
  margin-right: 6px;
  margin-bottom: 6px;
}

.drawer-stack {
  display: grid;
  gap: 16px;
}

.drawer-head h3 {
  margin: 0 0 6px;
}

.drawer-head p {
  margin: 0;
  color: #64748b;
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

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
 }

@media (max-width: 960px) {
  .filter-form {
    grid-template-columns: 1fr;
  }

  .toolbar-row,
  .table-meta,
  .pagination-row {
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
