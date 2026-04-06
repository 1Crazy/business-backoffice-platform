<!-- login 页面壳层：负责页面组装、路由上下文对接和顶层交互编排，具体请求与状态下沉到 composable。 -->
<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">销售运营控制台</div>
      <div class="hero-brand">
        <span class="hero-mark">S</span>
        <div>
          <strong>SCRM 控制台</strong>
          <span>客户、线索、销售节奏与权限治理的统一控制台</span>
        </div>
      </div>
      <h1>让客户、线索和销售协作真正连成一套可判断、可执行的闭环</h1>
      <p>这一版先聚焦权限、客户、线索跟进、看板和系统管理，为后续企业微信与自动化运营能力保留足够清晰的数据控制台骨架。</p>
      <div class="hero-grid">
        <article class="hero-card">
          <span>统一视图</span>
          <strong>客户 / 线索 / 提醒</strong>
          <p>用同一套筛选、归属和跟进节奏串起销售日常动作。</p>
        </article>
        <article class="hero-card">
          <span>运营判断</span>
          <strong>指标 + 口径 + 洞察</strong>
          <p>把时间范围、数据范围和核心指标收敛到一个判断面板里。</p>
        </article>
      </div>
    </section>

    <section class="page-card form-panel">
      <div class="panel-kicker">运营登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">后台登录</div>
          <div class="panel-caption">使用平台账号进入销售与客户运营控制台。</div>
        </div>
        <div class="identity-pill">控制台账号</div>
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
          登录系统
        </el-button>
      </el-form>
      <div class="hint">默认种子账号会在 Prisma seed 后生成。</div>
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
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 500px);
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
  background: rgba(30, 64, 175, 0.12);
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
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--app-accent) 0%, #2856e1 100%);
  color: white;
  font-size: 24px;
  font-weight: 700;
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
  max-width: 620px;
  margin: 0;
  font-size: 17px;
  line-height: 1.8;
  color: var(--app-text-secondary);
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 660px;
}

.hero-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(95, 125, 170, 0.14);
  box-shadow: 0 18px 32px rgba(16, 32, 59, 0.05);
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
  line-height: 1.45;
}

.hero-card p {
  margin-top: 10px;
  font-size: 13px;
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
  background: rgba(30, 64, 175, 0.08);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.submit-button {
  width: 100%;
  margin-top: 8px;
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
  background: rgba(232, 239, 252, 0.82);
  border: 1px solid rgba(95, 125, 170, 0.14);
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
