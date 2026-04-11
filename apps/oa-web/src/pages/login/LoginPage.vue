<!-- login 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">OA Office</div>
      <div class="hero-brand">
        <span class="hero-mark">OA</span>
        <div>
          <strong>OA 办公台</strong>
          <span>审批 · 请假 · 公告 · 通讯录</span>
        </div>
      </div>
      <h1>进入 OA，先处理今天的待办。</h1>
      <p>审批、请假、公告和通讯录都从这里开始。</p>
      <div class="hero-grid">
        <article class="hero-card">
          <span>待办处理</span>
          <strong>审批 / 请假</strong>
          <p>优先处理今天要过的流程。</p>
        </article>
        <article class="hero-card">
          <span>组织信息</span>
          <strong>公告 / 通讯录</strong>
          <p>查看通知和联系人。</p>
        </article>
      </div>
    </section>

    <section class="page-card form-panel">
      <div class="panel-kicker">系统登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">OA 登录</div>
          <div class="panel-caption">进入 OA 办公台。</div>
        </div>
        <div class="identity-pill">OA</div>
      </div>
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
          进入 OA
        </el-button>
      </el-form>
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

defineExpose({
  handleSubmit
});
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 500px);
  gap: 32px;
  align-items: center;
  padding: 40px;
}

.hero {
  display: grid;
  gap: 22px;
  padding: 36px 48px;
}

.hero-chip {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hero-mark {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--app-accent) 0%, var(--app-accent-strong) 100%);
  color: white;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
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
  font-size: clamp(36px, 5vw, 62px);
  line-height: 1.03;
  letter-spacing: -0.05em;
  color: var(--app-text-primary);
}

.hero p {
  max-width: 640px;
  margin: 0;
  font-size: 17px;
  line-height: 1.8;
  color: var(--app-text-secondary);
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 640px;
}

.hero-card {
  padding: 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(125, 148, 171, 0.14);
  box-shadow: 0 18px 32px rgba(23, 32, 43, 0.04);
}

.hero-card span {
  display: block;
  color: var(--app-text-tertiary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card strong {
  display: block;
  margin-top: 10px;
  font-size: 18px;
  line-height: 1.4;
}

.hero-card p {
  margin-top: 10px;
  font-size: 13px;
  color: var(--app-text-secondary);
  line-height: 1.7;
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

.panel-caption {
  margin-top: 6px;
  color: var(--app-text-secondary);
  line-height: 1.7;
  font-size: 13px;
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

.submit-button :deep(span) {
  font-weight: 700;
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
  border: 1px solid rgba(125, 148, 171, 0.12);
}

.credential-card span {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.credential-card strong {
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

  .hero-grid {
    grid-template-columns: 1fr;
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
