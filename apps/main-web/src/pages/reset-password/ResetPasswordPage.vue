<template>
  <div class="reset-shell">
    <section class="reset-panel">
      <div class="panel-kicker">账户恢复</div>
      <div class="panel-head">
        <div class="panel-title">设置新密码</div>
        <p class="panel-copy">请输入新的登录密码。密码至少 12 位，并包含大小写字母、数字和符号。</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        require-asterisk-position="right"
        status-icon
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="新密码" prop="password" required>
          <el-input v-model="form.password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword" required>
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
        <el-button type="primary" class="submit-button" :loading="submitting" @click="handleSubmit">
          重置密码
        </el-button>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { resetPassword } from "@/api/auth.api";
import { getRequestErrorMessage, validateForm } from "@/utils/request";

const route = useRoute();
const router = useRouter();
const submitting = ref(false);
const formRef = ref<FormInstance>();
const token = computed(() => route.query.token?.toString().trim() ?? "");
const form = reactive({
  password: "",
  confirmPassword: ""
});
const rules: FormRules<typeof form> = {
  password: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error("两次输入的新密码不一致"));
          return;
        }
        callback();
      },
      trigger: "blur"
    }
  ]
};

async function handleSubmit(): Promise<void> {
  if (!token.value) {
    ElMessage.error("缺少重置令牌，请重新申请密码重置。");
    return;
  }

  const isValid = await validateForm(formRef.value);
  if (!isValid) {
    return;
  }

  submitting.value = true;
  try {
    await resetPassword({
      token: token.value,
      password: form.password
    });
    ElMessage.success("密码已重置，请使用新密码重新登录。");
    await router.push("/login");
  } catch (error) {
    ElMessage.error(getRequestErrorMessage(error, "重置密码失败，请重新申请密码重置。"));
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.reset-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #edf4fb 0%, #f7f9fc 50%, #edf2f7 100%);
}

.reset-panel {
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
  padding: 28px;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
}

.panel-kicker {
  color: var(--app-text-tertiary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-head {
  display: grid;
  gap: 8px;
}

.panel-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--app-text-primary);
}

.panel-copy {
  color: var(--app-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.submit-button {
  width: 100%;
}
</style>
