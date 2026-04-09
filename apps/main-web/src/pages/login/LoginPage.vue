<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">Enterprise Gateway</div>
      <div class="hero-brand">
        <span class="hero-mark">H</span>
        <div>
          <strong>主应用工作台</strong>
          <span>统一承接 OA 与 SCRM 的集团级业务入口</span>
        </div>
      </div>
      <h1>把办公流转与经营判断收束到同一张稳定的工作台里</h1>
      <p>主应用不是再造一套业务页面，而是用一层清晰、稳定、可维护的壳层，把 OA 和 SCRM 的内容页组织成统一入口，让员工进入后更快找到今天该处理的事情。</p>

      <div class="domain-grid">
        <article class="domain-card">
          <span>OA 办公</span>
          <strong>审批、请假、公告与通讯录</strong>
          <p>流程驱动的日常办公协作入口，适合处理高频组织动作。</p>
        </article>
        <article class="domain-card">
          <span>SCRM 经营</span>
          <strong>客户、线索、商机与经营分析</strong>
          <p>用统一视角承接销售运营判断、客户管理和权限治理。</p>
        </article>
      </div>
    </section>

    <section class="page-card form-panel">
      <div class="panel-kicker">统一登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">进入主应用</div>
          <div class="panel-caption">使用平台账号进入统一门户，再按权限访问 OA 与 SCRM 页面。</div>
        </div>
        <div class="identity-pill">统一账号</div>
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
        <el-button type="primary" class="submit-button" :loading="submitting" @click="handleSubmit">
          登录主应用
        </el-button>
      </el-form>

      <div class="hint">沿用仓库当前统一账号体系，子应用会共享同一份登录态。</div>
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
</script>

<style scoped src="./LoginPage.css"></style>
