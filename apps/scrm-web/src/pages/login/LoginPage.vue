<!-- login 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">Single-Tenant MVP</div>
      <h1>让客户、线索和销售协作真正连成闭环</h1>
      <p>
        这一版先聚焦权限、客户、线索跟进、看板和系统管理，为后续企业微信与自动化运营能力留出扩展空间。
      </p>
    </section>

    <section class="page-card form-panel">
      <div class="panel-title">后台登录</div>
      <el-form
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
      </el-form>
      <div class="hint">默认种子账号会在 Prisma seed 后生成：`admin / Admin123456!`</div>
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
const form = reactive({
  username: "admin",
  password: "Admin123456!"
});
const rules: FormRules<typeof form> = {
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

async function handleSubmit(): Promise<void> {
  const isValid = await validateForm(loginFormRef.value);
  if (!isValid) {
    return;
  }

  submitting.value = true;

  try {
    await authStore.login(normalizeRequiredText(form.username), normalizeRequiredText(form.password));
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
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 480px);
  gap: 28px;
  align-items: center;
  padding: 40px;
}

.hero {
  padding: 48px;
}

.hero-chip {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-weight: 600;
}

.hero h1 {
  margin: 22px 0 16px;
  font-size: clamp(36px, 5vw, 62px);
  line-height: 1.08;
  color: #0f172a;
}

.hero p {
  max-width: 620px;
  font-size: 17px;
  line-height: 1.8;
  color: #475569;
}

.form-panel {
  margin-right: 40px;
}

.panel-title {
  margin-bottom: 18px;
  font-size: 24px;
  font-weight: 700;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
}

.hint {
  margin-top: 14px;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .hero {
    padding: 10px 0;
  }

  .form-panel {
    margin-right: 0;
  }
}
</style>
