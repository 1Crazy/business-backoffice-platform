<template>
  <div class="reset-shell">
    <section class="reset-panel">
      <div class="panel-kicker">账户恢复</div>
      <div class="panel-head">
        <div class="panel-title">找回 OA 密码</div>
        <p class="panel-copy">输入账号或已验证邮箱。系统会通过邮件发送一次性重置链接。</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" require-asterisk-position="right" status-icon @submit.prevent="handleSubmit">
        <el-form-item label="账号或邮箱" prop="identifier" required>
          <el-input v-model="form.identifier" placeholder="请输入账号或邮箱" />
        </el-form-item>
        <el-button type="primary" class="submit-button" :loading="submitting" @click="handleSubmit">发送重置邮件</el-button>
        <el-button class="submit-button secondary-button" :disabled="submitting" @click="goLogin">返回登录</el-button>
      </el-form>
      <div class="hint">为了避免泄露账号信息，提交后都会返回统一结果。</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { requestPasswordReset } from "@/api/auth.api";
import { normalizeRequiredText } from "@/utils/form";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const router = useRouter();
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ identifier: "" });
const rules: FormRules<typeof form> = {
  identifier: [{ required: true, message: "请输入账号或邮箱", trigger: "blur" }]
};

async function handleSubmit(): Promise<void> {
  const isValid = await validateForm(formRef.value);
  if (!isValid) {
    return;
  }

  submitting.value = true;
  try {
    await requestPasswordReset({ identifier: normalizeRequiredText(form.identifier) });
    ElMessage.success("如果账号存在且邮箱已验证，重置邮件将在数分钟内送达。");
    await router.push("/login");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "发送重置邮件失败，请稍后重试。"));
  } finally {
    submitting.value = false;
  }
}

async function goLogin() {
  await router.push("/login");
}
</script>

<style scoped>
.reset-shell { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: linear-gradient(135deg, #edf4fb 0%, #f7f9fc 50%, #edf2f7 100%); }
.reset-panel { width: min(100%, 480px); display: grid; gap: 18px; padding: 28px; border-radius: 24px; border: 1px solid rgba(15, 23, 42, 0.08); background: rgba(255, 255, 255, 0.96); box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08); }
.panel-kicker { color: var(--app-text-tertiary); font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.panel-head { display: grid; gap: 8px; }
.panel-title { font-size: 28px; font-weight: 700; color: var(--app-text-primary); }
.panel-copy, .hint { color: var(--app-text-secondary); font-size: 13px; line-height: 1.7; }
.submit-button { width: 100%; }
.secondary-button { margin-top: -6px; }
</style>
