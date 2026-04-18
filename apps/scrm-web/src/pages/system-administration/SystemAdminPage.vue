<!-- system-administration 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <section class="system-page page-card">
    <template v-if="isInitialLoading">
      <div class="system-skeleton">
        <div class="system-tabs-skeleton">
          <span class="ui-skeleton ui-skeleton-pill" />
          <span class="ui-skeleton ui-skeleton-pill" />
        </div>
        <div class="system-body-skeleton">
          <span class="ui-skeleton ui-skeleton-line medium" />
          <span class="ui-skeleton ui-skeleton-line long" />
          <div v-for="item in 4" :key="item" class="system-row-skeleton">
            <span class="ui-skeleton ui-skeleton-line medium" />
            <span class="ui-skeleton ui-skeleton-line short" />
            <span class="ui-skeleton ui-skeleton-line long" />
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <GovernanceOverviewSection :items="governanceOverviewItems" />

      <el-tabs class="system-tabs">
        <el-tab-pane label="批处理任务">
          <BatchTasksSection
            :filters="batchTaskFilters"
            :category-options="batchTaskCategoryOptions"
            :status-options="batchTaskStatusOptions"
            :tasks="visibleBatchTasks"
            :selected-task="selectedBatchTask"
            :drawer-visible="batchTaskDrawerVisible"
            @reset="resetBatchTaskFilters"
            @update:category="batchTaskFilters.category = $event"
            @update:status="batchTaskFilters.status = $event"
            @view="openBatchTaskDrawer"
            @close="closeBatchTaskDrawer"
          />
        </el-tab-pane>

        <el-tab-pane label="字典配置">
          <DictionaryManagementSection
            :dictionary-entries="dictionaryEntries"
            @create="openDictionaryDialog"
            @edit="openDictionaryDialog"
          />
        </el-tab-pane>

        <el-tab-pane label="开放接口">
          <OpenApiCredentialsSection
            :credentials="openApiCredentials"
            :secret-notice="secretRevealNotice?.type === 'credential' ? secretRevealNotice : null"
            @create="openOpenApiCredentialDialog"
            @rotate="rotateOpenApiCredentialSecret"
            @revoke="revokeOpenApiCredentialRecord"
          />
        </el-tab-pane>

        <el-tab-pane label="回调订阅">
          <WebhookSubscriptionsSection
            :subscriptions="webhookSubscriptions"
            :deliveries-by-subscription-id="webhookDeliveriesBySubscriptionId"
            :secret-notice="secretRevealNotice?.type === 'webhook' ? secretRevealNotice : null"
            @create="openWebhookSubscriptionDialog"
            @edit="openWebhookSubscriptionDialog"
            @test="sendWebhookTest"
          />
        </el-tab-pane>

        <el-tab-pane label="企业身份">
          <IdentityConnectorsSection
            :connectors="identityConnectors"
            @create="openIdentityConnectorDialog"
            @edit="openIdentityConnectorDialog"
          />
        </el-tab-pane>

        <el-tab-pane label="审计日志">
          <AuditLogsSection
            :filter="auditFilter"
            :audit-logs="auditLogs"
            :audit-action-options="auditActionOptions"
            :audit-target-type-options="auditTargetTypeOptions"
            :audit-sort-options="auditSortOptions"
            :loading="isAuditLoading"
            :refreshing="isAuditRefreshing"
            :table-state="auditTableState"
            :current-sort-label="currentAuditSortLabel"
            @reset="resetAuditFilters"
            @update:sort-preset="auditTableState.sortPreset = $event"
            @page-change="handleAuditPageChange"
            @page-size-change="handleAuditPageSizeChange"
          />
        </el-tab-pane>
      </el-tabs>

      <DictionaryDialog
        v-model:visible="dictionaryDialogVisible"
        :form="dictionaryForm"
        :rules="dictionaryRules"
        :set-form-ref="setDictionaryFormRef"
        @submit="submitDictionary"
      />

      <el-dialog v-model="openApiCredentialDialogVisible" title="新建开放接口凭证" width="560px">
        <el-form
          :model="openApiCredentialForm"
          :rules="openApiCredentialRules"
          label-position="top"
          :ref="setOpenApiFormRef"
        >
          <el-form-item label="凭证名称" prop="name">
            <el-input v-model="openApiCredentialForm.name" placeholder="例如：经营分析只读凭证" />
          </el-form-item>
          <el-form-item label="权限范围" prop="scopes">
              <el-checkbox-group v-model="openApiCredentialForm.scopes">
              <el-checkbox v-for="item in openApiScopeOptions" :key="item" :label="item">
                {{ formatOpenApiScope(item) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="openApiCredentialForm.expiresAt"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="可选"
              class="dialog-field"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="openApiCredentialDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitOpenApiCredential">创建凭证</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="webhookSubscriptionDialogVisible"
        :title="webhookSubscriptionForm.id ? '编辑回调订阅' : '新建回调订阅'"
        width="640px"
      >
        <el-form
          :model="webhookSubscriptionForm"
          :rules="webhookSubscriptionRules"
          label-position="top"
          :ref="setWebhookFormRef"
        >
          <el-form-item label="订阅名称" prop="name">
            <el-input v-model="webhookSubscriptionForm.name" placeholder="例如：经营数据回调" />
          </el-form-item>
          <el-form-item label="回调地址" prop="endpointUrl">
            <el-input v-model="webhookSubscriptionForm.endpointUrl" placeholder="https://example.com/webhooks/revenue" />
          </el-form-item>
          <el-form-item label="事件类型" prop="eventTypes">
            <el-checkbox-group v-model="webhookSubscriptionForm.eventTypes">
              <el-checkbox v-for="item in webhookEventOptions" :key="item" :label="item">
                {{ formatWebhookEventType(item) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <div class="dialog-grid">
            <el-form-item label="状态">
              <el-select v-model="webhookSubscriptionForm.status" placeholder="请选择订阅状态">
                <el-option
                  v-for="item in webhookStatusOptions"
                  :key="item"
                  :label="formatAccessStatus(item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="最大重试次数">
              <el-input-number
                v-model="webhookSubscriptionForm.maxAttempts"
                :min="1"
                :max="10"
                placeholder="请输入最大重试次数"
              />
            </el-form-item>
            <el-form-item label="超时（秒）">
              <el-input-number
                v-model="webhookSubscriptionForm.timeoutSeconds"
                :min="1"
                :max="60"
                placeholder="请输入超时时间"
              />
            </el-form-item>
          </div>
          <el-form-item label="轮换签名密钥">
            <el-switch v-model="webhookSubscriptionForm.rotateSecret" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="webhookSubscriptionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitWebhookSubscription">保存订阅</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="identityConnectorDialogVisible"
        :title="identityConnectorForm.id ? '编辑身份连接器' : '新建身份连接器'"
        width="720px"
      >
        <el-form
          :model="identityConnectorForm"
          :rules="identityConnectorRules"
          label-position="top"
          :ref="setIdentityConnectorFormRef"
        >
          <div class="dialog-grid">
            <el-form-item label="连接器名称" prop="name">
              <el-input v-model="identityConnectorForm.name" placeholder="例如：企业统一登录入口" />
            </el-form-item>
            <el-form-item label="连接器类型">
              <el-select v-model="identityConnectorForm.type" placeholder="请选择连接器类型">
                <el-option
                  v-for="item in identityConnectorTypeOptions"
                  :key="item"
                  :label="formatIdentityConnectorType(item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="identityConnectorForm.status" placeholder="请选择连接器状态">
                <el-option
                  v-for="item in identityConnectorStatusOptions"
                  :key="item"
                  :label="formatAccessStatus(item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="映射字段">
              <el-select v-model="identityConnectorForm.matchField" placeholder="请选择映射字段">
                <el-option
                  v-for="item in identityConnectorMatchOptions"
                  :key="item"
                  :label="formatIdentityConnectorMatchField(item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="dialog-grid">
            <el-form-item label="签发方地址">
              <el-input v-model="identityConnectorForm.issuerUrl" placeholder="例如：https://id.example.com" />
            </el-form-item>
            <el-form-item label="授权地址">
              <el-input v-model="identityConnectorForm.authorizeUrl" placeholder="例如：https://id.example.com/oauth/authorize" />
            </el-form-item>
            <el-form-item label="令牌地址">
              <el-input v-model="identityConnectorForm.tokenUrl" placeholder="例如：https://id.example.com/oauth/token" />
            </el-form-item>
            <el-form-item label="目录服务地址">
              <el-input v-model="identityConnectorForm.directoryUrl" placeholder="例如：ldaps://directory.example.com" />
            </el-form-item>
          </div>
          <div class="dialog-grid">
            <el-form-item label="客户端标识">
              <el-input v-model="identityConnectorForm.clientId" placeholder="请输入客户端标识（Client ID）" />
            </el-form-item>
            <el-form-item label="客户端密钥">
              <el-input
                v-model="identityConnectorForm.clientSecret"
                type="password"
                show-password
                placeholder="请输入客户端密钥（Client Secret）"
              />
            </el-form-item>
          </div>
          <el-form-item label="允许域名">
            <el-input
              v-model="identityConnectorForm.allowedDomainsText"
              type="textarea"
              :rows="2"
              placeholder="多个域名使用逗号或换行分隔"
            />
          </el-form-item>
          <el-form-item label="扩展配置（JSON）">
            <el-input
              v-model="identityConnectorForm.configText"
              type="textarea"
              :rows="6"
              placeholder="{&quot;group&quot;:&quot;finance&quot;}"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="identityConnectorDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitIdentityConnector">保存连接器</el-button>
        </template>
      </el-dialog>
    </template>
  </section>
</template>

<script setup lang="ts">
import AuditLogsSection from "@/pages/system-administration/components/AuditLogsSection.vue";
import BatchTasksSection from "@/pages/system-administration/components/BatchTasksSection.vue";
import DictionaryDialog from "@/pages/system-administration/components/DictionaryDialog.vue";
import DictionaryManagementSection from "@/pages/system-administration/components/DictionaryManagementSection.vue";
import GovernanceOverviewSection from "@/pages/system-administration/components/GovernanceOverviewSection.vue";
import IdentityConnectorsSection from "@/pages/system-administration/components/IdentityConnectorsSection.vue";
import OpenApiCredentialsSection from "@/pages/system-administration/components/OpenApiCredentialsSection.vue";
import WebhookSubscriptionsSection from "@/pages/system-administration/components/WebhookSubscriptionsSection.vue";
import { useSystemAdministrationPage } from "@/composables/system-administration/useSystemAdministrationPage";
import {
  formatAccessStatus,
  formatIdentityConnectorMatchField,
  formatIdentityConnectorType,
  formatOpenApiScope,
  formatWebhookEventType
} from "@/utils/display";

const {
  auditActionOptions,
  auditFilter,
  auditLogs,
  auditSortOptions,
  auditTableState,
  auditTargetTypeOptions,
  batchTaskCategoryOptions,
  batchTaskDrawerVisible,
  batchTaskFilters,
  batchTaskStatusOptions,
  closeBatchTaskDrawer,
  currentAuditSortLabel,
  dictionaryDialogVisible,
  dictionaryEntries,
  dictionaryForm,
  dictionaryRules,
  governanceOverviewItems,
  handleAuditPageChange,
  handleAuditPageSizeChange,
  identityConnectorDialogVisible,
  identityConnectorForm,
  identityConnectorMatchOptions,
  identityConnectorRules,
  identityConnectorStatusOptions,
  identityConnectorTypeOptions,
  identityConnectors,
  isAuditLoading,
  isAuditRefreshing,
  isInitialLoading,
  openApiCredentialDialogVisible,
  openApiCredentialForm,
  openApiCredentialRules,
  openApiCredentials,
  openApiScopeOptions,
  openBatchTaskDrawer,
  openDictionaryDialog,
  openIdentityConnectorDialog,
  openOpenApiCredentialDialog,
  openWebhookSubscriptionDialog,
  resetBatchTaskFilters,
  resetAuditFilters,
  revokeOpenApiCredentialRecord,
  rotateOpenApiCredentialSecret,
  selectedBatchTask,
  secretRevealNotice,
  sendWebhookTest,
  setDictionaryFormRef,
  setIdentityConnectorFormRef,
  setOpenApiFormRef,
  setWebhookFormRef,
  submitDictionary,
  submitIdentityConnector,
  submitOpenApiCredential,
  submitWebhookSubscription,
  visibleBatchTasks,
  webhookDeliveriesBySubscriptionId,
  webhookEventOptions,
  webhookStatusOptions,
  webhookSubscriptionDialogVisible,
  webhookSubscriptionForm,
  webhookSubscriptionRules,
  webhookSubscriptions
} = useSystemAdministrationPage();
</script>

<style scoped>
.system-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.system-skeleton,
.system-body-skeleton {
  display: grid;
  gap: 12px;
}

.system-tabs-skeleton {
  display: flex;
  gap: 10px;
}

.system-row-skeleton {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(95, 125, 170, 0.14);
  background: rgba(248, 251, 255, 0.62);
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.dialog-field {
  width: 100%;
}

:deep(.el-tabs__nav-scroll) {
  display: flex;
}

:deep(.system-tabs .el-tabs__nav) {
  margin-left: 0;
}

:deep(.el-tabs),
:deep(.el-tabs__header),
:deep(.el-tabs__nav-wrap),
:deep(.el-tabs__content),
:deep(.el-tab-pane) {
  min-width: 0;
}

@media (max-width: 960px) {
  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
