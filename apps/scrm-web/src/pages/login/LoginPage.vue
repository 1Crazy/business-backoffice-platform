<!-- login 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">SCRM</div>
      <div class="hero-brand">
        <div>
          <strong>SCRM 控制台</strong>
          <span>客户 · 线索 · 商机 · 看板</span>
        </div>
      </div>
      <div class="hero-copy">
        <h1>SCRM 经营工作入口</h1>
        <p>统一进入客户、线索、商机与经营看板等业务工作区。</p>
      </div>
      <div class="hero-note" aria-label="能力标识">
        <span>客户管理</span>
        <span>商机推进</span>
      </div>
    </section>

    <section class="page-card form-panel">
      <div class="panel-kicker">系统登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">后台登录</div>
        </div>
        <div class="identity-pill">SCRM</div>
      </div>
      <el-form
        v-if="!authStore.requiresMfa"
        ref="loginFormRef"
        :model="form"
        :rules="rules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="账号" prop="username" required>
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password" required>
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" class="submit-button" @click="handleSubmit">
          登录系统
        </el-button>
        <el-button text class="link-button" :disabled="submitting" @click="goForgotPassword">
          忘记密码
        </el-button>
      </el-form>
      <el-form
        v-else
        ref="mfaFormRef"
        :model="mfaForm"
        :rules="mfaRules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        class="dialog-form"
        @submit.prevent="handleMfaSubmit"
      >
        <div class="mfa-panel">
          <div class="mfa-title">{{ authStore.pendingMfa?.enrollmentRequired ? "启用身份验证器" : "输入动态验证码" }}</div>
          <div class="mfa-copy">
            <template v-if="authStore.pendingMfa?.enrollmentRequired">
              当前账号具有高权限访问范围，首次登录前需要先绑定身份验证器。将下方 `otpauth` 地址导入认证器后，再输入 6 位验证码完成登录。
            </template>
            <template v-else>
              当前账号已启用多因素认证。请输入身份验证器验证码或恢复码继续登录。
            </template>
          </div>
          <el-input
            v-if="authStore.pendingMfa?.setupChallenge"
            :model-value="authStore.pendingMfa.setupChallenge"
            readonly
            type="textarea"
            :rows="4"
          />
        </div>
        <el-form-item label="验证码 / 恢复码" prop="code" required>
          <el-input v-model="mfaForm.code" placeholder="请输入 6 位验证码或恢复码" />
        </el-form-item>
        <el-button type="primary" :loading="submitting" class="submit-button" @click="handleMfaSubmit">
          完成验证
        </el-button>
        <el-button class="submit-button secondary-button" :disabled="submitting" @click="resetMfaFlow">
          返回账号密码登录
        </el-button>
      </el-form>
      <div v-if="authStore.latestRecoveryCodes.length" class="credential-card recovery-card">
        <span>恢复码</span>
        <strong>{{ authStore.latestRecoveryCodes.join(" / ") }}</strong>
      </div>
      <div class="hint">体验账号可直接进入。</div>
      <div class="credential-card">
        <span>体验账号</span>
        <strong>admin / Admin123456!</strong>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { resolveFirstAccessiblePath } from "@/router/access";
import { useAuthStore } from "@/stores/auth";
import { normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const authStore = useAuthStore();
const router = useRouter();
const submitting = ref(false);
const loginFormRef = ref<FormInstance>();
const mfaFormRef = ref<FormInstance>();
const form = reactive({
  username: "admin",
  password: "Admin123456!"
});
const mfaForm = reactive({
  code: ""
});
const rules: FormRules<typeof form> = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};
const mfaRules: FormRules<typeof mfaForm> = {
  code: [{ required: true, message: "请输入验证码或恢复码", trigger: "blur" }]
};

async function handleSubmit(): Promise<void> {
  const isValid = await validateForm(loginFormRef.value);
  if (!isValid) {
    return;
  }

  submitting.value = true;

  try {
    const loginResult = await authStore.login(normalizeRequiredText(form.username), normalizeRequiredText(form.password));
    if (loginResult.mfaRequired) {
      mfaForm.code = "";
      ElMessage.warning(loginResult.mfaEnrollmentRequired ? "请先完成身份验证器绑定。" : "请输入动态验证码完成登录。");
      return;
    }
    const targetPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);

    if (!targetPath) {
      await router.push("/no-access");
      ElMessage.warning("当前账号没有可访问的页面，请联系管理员分配权限。");
      return;
    }

    await router.push(targetPath);
    ElMessage.success("登录成功。");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "登录失败，请检查账号密码和后端服务状态。"));
  } finally {
    submitting.value = false;
  }
}

async function handleMfaSubmit(): Promise<void> {
  const isValid = await validateForm(mfaFormRef.value);
  if (!isValid) {
    return;
  }

  submitting.value = true;

  try {
    await authStore.completeMfa(normalizeRequiredText(mfaForm.code));
    const targetPath = resolveFirstAccessiblePath(authStore.currentUser?.permissions ?? []);

    if (!targetPath) {
      await router.push("/no-access");
      ElMessage.warning("当前账号没有可访问的页面，请联系管理员分配权限。");
      return;
    }

    await router.push(targetPath);
    ElMessage.success(authStore.latestRecoveryCodes.length ? "MFA 已启用并登录成功。" : "登录成功。");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "MFA 验证失败，请检查验证码或恢复码。"));
  } finally {
    submitting.value = false;
  }
}

function resetMfaFlow(): void {
  authStore.clearPendingMfa();
  mfaForm.code = "";
}

async function goForgotPassword() {
  await router.push("/forgot-password");
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  width: min(100%, 1480px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 500px);
  gap: 44px;
  align-items: center;
  padding: 32px;
  position: relative;
  isolation: isolate;
}

.login-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 14% 20%, rgba(37, 99, 235, 0.16), transparent 34%),
    radial-gradient(ellipse at 84% 18%, rgba(56, 189, 248, 0.12), transparent 28%),
    radial-gradient(circle at 78% 80%, rgba(14, 165, 233, 0.12), transparent 22%),
    radial-gradient(circle at 54% 46%, rgba(255, 255, 255, 0.58), transparent 34%),
    linear-gradient(135deg, #e7f1f8 0%, #f4f8fb 46%, #e7f0f6 100%);
  z-index: -2;
}

.login-shell::after {
  content: "";
  position: fixed;
  inset: 0;
  background:
    linear-gradient(118deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0) 34%),
    linear-gradient(304deg, rgba(14, 165, 233, 0.05) 10%, rgba(14, 165, 233, 0) 30%),
    radial-gradient(circle at 24% 72%, rgba(255, 255, 255, 0.34), transparent 26%);
  z-index: -1;
  pointer-events: none;
}

.hero {
  display: grid;
  align-content: center;
  gap: 24px;
  min-height: 560px;
  padding: 32px 16px 32px 0;
}

.hero-chip {
  display: inline-flex;
  width: fit-content;
  padding: 0;
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-brand {
  display: block;
}

.hero-brand strong,
.hero-brand span {
  display: block;
}

.hero-brand strong {
  font-size: 15px;
}

.hero-brand span {
  margin-top: 4px;
  color: var(--app-text-secondary);
  font-size: 13px;
}

.hero h1 {
  margin: 0;
  max-width: 480px;
  font-size: clamp(36px, 3.6vw, 46px);
  line-height: 1.14;
  letter-spacing: -0.05em;
  color: var(--app-text-primary);
}

.hero-copy {
  display: grid;
  gap: 14px;
  padding-left: 24px;
  border-left: 3px solid rgba(37, 99, 235, 0.12);
}

.hero p {
  max-width: 480px;
  margin: 0;
  font-size: 15px;
  line-height: 1.85;
  color: var(--app-text-secondary);
}

.hero-note {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-left: 24px;
}

.hero-note span {
  display: inline-flex;
  align-items: center;
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-note span + span::before {
  content: "/";
  margin-right: 18px;
  color: rgba(95, 125, 170, 0.42);
}

.form-panel {
  margin-right: 24px;
  display: grid;
  gap: 18px;
}

.panel-kicker {
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
}

.identity-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.secondary-button {
  margin-top: 0;
}

.link-button {
  justify-self: flex-end;
  margin-top: -4px;
  padding-right: 0;
}

.mfa-panel {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f7faff;
  border: 1px solid rgba(59, 130, 246, 0.14);
}

.mfa-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.mfa-copy {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.hint {
  color: var(--app-text-secondary);
  font-size: 13px;
}

.credential-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(239, 246, 255, 0.84);
  border: 1px solid rgba(95, 125, 170, 0.14);
}

.credential-card span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.credential-card strong {
  font-size: 13px;
}

.recovery-card strong {
  line-height: 1.7;
  word-break: break-word;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .hero {
    min-height: auto;
    padding: 8px 0 4px;
  }

  .form-panel {
    margin-right: 0;
  }
}

@media (max-width: 640px) {
  .hero-brand,
  .panel-head,
  .credential-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
