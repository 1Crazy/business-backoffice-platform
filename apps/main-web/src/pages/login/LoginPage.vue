<template>
  <div class="login-shell">
    <section class="hero">
      <div class="hero-chip">Business Backoffice</div>
      <div class="hero-brand">
        <span class="hero-mark">BP</span>
        <div>
          <strong>业务主系统</strong>
          <span>平台治理 · OA · SCRM</span>
        </div>
      </div>
      <h1>进入业务主系统。</h1>
      <p>从这里进入平台治理、OA 和 SCRM，直接开始当天工作。</p>

      <div class="domain-grid">
        <article class="domain-card">
          <span>OA 办公</span>
          <strong>审批、请假、公告与通讯录</strong>
          <p>处理待办与组织协同。</p>
        </article>
        <article class="domain-card">
          <span>SCRM 经营</span>
          <strong>客户、线索、商机与经营分析</strong>
          <p>查看进展并继续推进销售。</p>
        </article>
      </div>
    </section>

    <section class="form-panel">
      <div class="panel-kicker">系统登录</div>
      <div class="panel-head">
        <div>
          <div class="panel-title">登录主系统</div>
          <div class="panel-caption">进入平台治理、OA 或 SCRM。</div>
        </div>
        <div class="identity-pill">主系统</div>
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
          进入系统
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
