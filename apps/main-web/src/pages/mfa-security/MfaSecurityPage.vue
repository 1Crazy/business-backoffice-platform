<template>
  <div class="mfa-page">
    <section class="page-card mfa-hero">
      <div class="mfa-hero-copy">
        <span class="mfa-kicker">账号安全</span>
        <h1>身份验证器、恢复码和重绑流程统一收口</h1>
        <p>高权限账号通过身份验证器补充第二因素认证。这里集中处理启用状态、重新绑定、恢复码轮换和关闭动作，避免安全配置散落在登录流程里。</p>
      </div>
      <div class="mfa-status-pill" :data-tone="statusTone">
        <span>当前状态</span>
        <strong>{{ statusLabel }}</strong>
      </div>
    </section>

    <section class="mfa-summary-grid">
      <article v-for="item in summaryItems" :key="item.label" class="page-card mfa-summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </section>

    <section class="mfa-shell">
      <article class="page-card mfa-panel primary">
        <div class="mfa-panel-head">
          <div>
            <span class="mfa-kicker">绑定状态</span>
            <h2>身份验证器配置</h2>
          </div>
          <el-button type="primary" :loading="isSubmitting" @click="startSetup">
            {{ status.enabled ? "重新生成绑定信息" : "开始绑定身份验证器" }}
          </el-button>
        </div>

        <p class="mfa-copy">
          {{ status.enabled ? "重新绑定会生成一组新的 secret，旧设备上的动态码会失效。" : "首次启用后，登录时除了密码，还需要身份验证器生成的 6 位动态码。" }}
        </p>

        <div class="mfa-meta-grid">
          <article class="mfa-meta-card">
            <span>验证标准</span>
            <strong>TOTP</strong>
          </article>
          <article class="mfa-meta-card">
            <span>推荐客户端</span>
            <strong>Google / Microsoft / 1Password</strong>
          </article>
          <article class="mfa-meta-card">
            <span>最近启用</span>
            <strong>{{ status.configuredAt ? formatDateTime(status.configuredAt) : "尚未配置" }}</strong>
          </article>
        </div>
      </article>

      <article class="page-card mfa-panel">
        <div class="mfa-panel-head">
          <div>
            <span class="mfa-kicker">确认绑定</span>
            <h2>验证并完成切换</h2>
          </div>
          <el-tag :type="status.pending ? 'warning' : 'info'">
            {{ status.pending ? "待输入动态码" : "等待新绑定信息" }}
          </el-tag>
        </div>

        <div class="mfa-form-grid">
          <div class="mfa-field">
            <label>绑定地址</label>
            <el-input :model-value="setupChallenge ?? ''" type="textarea" :rows="5" readonly placeholder="点击“开始绑定身份验证器”后显示新的 otpauth 地址" />
          </div>

          <div class="mfa-field">
            <label>6 位动态码</label>
            <el-input v-model="setupForm.code" maxlength="12" placeholder="输入身份验证器生成的 6 位验证码" />
          </div>

          <div class="mfa-actions">
            <el-button type="primary" :disabled="!setupForm.code.trim()" :loading="isSubmitting" @click="confirmSetup">
              完成绑定
            </el-button>
          </div>
        </div>
      </article>

      <article class="page-card mfa-panel">
        <div class="mfa-panel-head">
          <div>
            <span class="mfa-kicker">恢复通道</span>
            <h2>恢复码轮换</h2>
          </div>
          <el-button text :disabled="!status.enabled" :loading="isSubmitting" @click="rotateRecoveryCodes">
            轮换恢复码
          </el-button>
        </div>

        <p class="mfa-copy">恢复码用于身份验证器暂时不可用时完成登录或关闭 MFA。每次轮换都会让旧恢复码全部失效。</p>

        <div class="mfa-field compact">
          <label>验证码或恢复码</label>
          <el-input v-model="setupForm.recoveryCode" maxlength="24" placeholder="输入当前动态码或现有恢复码以确认轮换/关闭" />
        </div>

        <div class="mfa-recovery-list">
          <div v-if="latestRecoveryCodes.length === 0" class="mfa-empty-state">当前没有新生成的恢复码。</div>
          <div v-else class="mfa-recovery-grid">
            <code v-for="item in latestRecoveryCodes" :key="item" class="mfa-recovery-code">{{ item }}</code>
          </div>
        </div>
      </article>

      <article class="page-card mfa-panel danger">
        <div class="mfa-panel-head">
          <div>
            <span class="mfa-kicker">风险操作</span>
            <h2>关闭 MFA</h2>
          </div>
          <el-button text type="danger" :disabled="!status.enabled || !setupForm.recoveryCode.trim()" :loading="isSubmitting" @click="disableMfa">
            关闭 MFA
          </el-button>
        </div>

        <p class="mfa-copy">关闭后，账号会退回到仅密码登录。高权限账号不建议长期关闭；生产环境应优先执行重新绑定而不是停用第二因素。</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { useMfaSecurityPage } from "@/composables/useMfaSecurityPage";

const {
  isLoading,
  isSubmitting,
  status,
  statusTone,
  statusLabel,
  setupChallenge,
  latestRecoveryCodes,
  setupForm,
  summaryItems,
  load,
  startSetup,
  confirmSetup,
  rotateRecoveryCodes,
  disableMfa
} = useMfaSecurityPage();

onMounted(() => {
  void load();
});

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
</script>

<style scoped>
.mfa-page {
  display: grid;
  gap: 16px;
}

.mfa-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(244, 248, 255, 0.94)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 28%);
}

.mfa-hero-copy {
  display: grid;
  gap: 12px;
}

.mfa-kicker {
  display: inline-flex;
  width: fit-content;
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mfa-hero h1,
.mfa-panel h2 {
  margin: 0;
  letter-spacing: 0;
}

.mfa-hero h1 {
  max-width: 680px;
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.18;
}

.mfa-hero p,
.mfa-copy {
  margin: 0;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.mfa-status-pill {
  display: grid;
  gap: 2px;
  min-width: 168px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.88);
}

.mfa-status-pill[data-tone="success"] {
  background: #effaf4;
}

.mfa-status-pill[data-tone="warning"] {
  background: #fff7e8;
}

.mfa-status-pill strong {
  font-size: 20px;
}

.mfa-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.mfa-summary-card,
.mfa-meta-card {
  display: grid;
  gap: 8px;
}

.mfa-summary-card span,
.mfa-meta-card span {
  color: var(--app-text-tertiary);
  font-size: 12px;
}

.mfa-summary-card strong,
.mfa-meta-card strong {
  font-size: 24px;
  line-height: 1.2;
}

.mfa-shell {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mfa-panel {
  display: grid;
  gap: 18px;
}

.mfa-panel.primary,
.mfa-panel.danger {
  grid-column: span 2;
}

.mfa-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mfa-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mfa-meta-card {
  padding: 14px;
  border-radius: 16px;
  background: #f7f9fc;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.mfa-form-grid {
  display: grid;
  gap: 14px;
}

.mfa-field {
  display: grid;
  gap: 8px;
}

.mfa-field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--app-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mfa-actions {
  display: flex;
  justify-content: flex-start;
}

.mfa-field.compact :deep(.el-input__wrapper) {
  min-height: 42px;
}

.mfa-recovery-list {
  min-height: 68px;
}

.mfa-empty-state {
  display: flex;
  align-items: center;
  min-height: 68px;
  padding: 0 2px;
  color: var(--app-text-tertiary);
}

.mfa-recovery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.mfa-recovery-code {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 14px;
  background: #f5f8ff;
  border: 1px dashed rgba(37, 99, 235, 0.24);
  color: #18418f;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .mfa-summary-grid,
  .mfa-shell,
  .mfa-meta-grid {
    grid-template-columns: 1fr;
  }

  .mfa-panel.primary,
  .mfa-panel.danger {
    grid-column: auto;
  }

  .mfa-hero {
    grid-template-columns: 1fr;
  }

  .mfa-panel-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
