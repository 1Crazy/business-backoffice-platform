<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">Business Backoffice</div>
      <div class="hero-brand">
        <div>
          <strong>业务主系统</strong>
          <span>平台治理 · OA · SCRM</span>
        </div>
      </div>
      <div class="hero-copy">
        <h1>业务后台统一入口</h1>
        <p>统一身份认证后，按权限进入平台治理、OA 或 SCRM 工作区。</p>
      </div>

      <div class="hero-note" aria-label="能力标识">
        <span>统一身份认证</span>
        <span>访问权限控制</span>
      </div>
    </section>

    <section class="form-panel">
      <div class="panel-kicker">系统登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">登录主系统</div>
        </div>
        <div class="identity-pill">主系统</div>
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
        <el-button type="primary" class="submit-button" :loading="submitting" @click="handleSubmit">
          进入系统
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
              当前账号属于高权限角色，首次登录前需要先绑定身份验证器。将下方 `otpauth` 地址导入认证器后，再输入 6 位验证码完成登录。
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
        <el-button type="primary" class="submit-button" :loading="submitting" @click="handleMfaSubmit">
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
      ElMessage.warning("当前账号没有可访问的主应用页面，请联系管理员分配权限。");
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
      ElMessage.warning("当前账号没有可访问的主应用页面，请联系管理员分配权限。");
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

<style scoped src="./LoginPage.css"></style>
