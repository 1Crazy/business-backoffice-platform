import { ElMessage } from "element-plus";
import { computed, reactive, ref } from "vue";

import { configureMfa, fetchMfaStatus } from "@/api/auth.api";
import type { MfaStatus, MfaSetupResponse } from "@/types/auth";
import { getRequestErrorMessage } from "@/utils/request";

type MfaAction = "setup" | "rotate-recovery" | "disable";

function createEmptyStatus(): MfaStatus {
  return {
    enabled: false,
    pending: false,
    configuredAt: null
  };
}

export function useMfaSecurityPage() {
  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const status = ref<MfaStatus>(createEmptyStatus());
  const setupChallenge = ref<string | null>(null);
  const latestRecoveryCodes = ref<string[]>([]);
  const setupForm = reactive({
    code: "",
    recoveryCode: ""
  });

  const statusTone = computed(() => {
    if (status.value.pending) {
      return "warning";
    }

    return status.value.enabled ? "success" : "info";
  });

  const statusLabel = computed(() => {
    if (status.value.pending) {
      return "待确认";
    }

    return status.value.enabled ? "已启用" : "未启用";
  });

  const summaryItems = computed(() => [
    {
      label: "当前状态",
      value: statusLabel.value
    },
    {
      label: "验证方式",
      value: "TOTP 动态码"
    },
    {
      label: "恢复码",
      value: latestRecoveryCodes.value.length ? `${latestRecoveryCodes.value.length} 组待保存` : "按需轮换"
    }
  ]);

  async function load(): Promise<void> {
    isLoading.value = true;

    try {
      status.value = await fetchMfaStatus();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, "无法加载 MFA 状态，请稍后重试。"));
    } finally {
      isLoading.value = false;
    }
  }

  async function startSetup(): Promise<void> {
    await runAction("setup");
  }

  async function confirmSetup(): Promise<void> {
    await runAction("setup");
  }

  async function rotateRecoveryCodes(): Promise<void> {
    await runAction("rotate-recovery");
  }

  async function disableMfa(): Promise<void> {
    await runAction("disable");
  }

  async function runAction(action: MfaAction): Promise<void> {
    isSubmitting.value = true;

    try {
      const response = await configureMfa(buildPayload(action));
      applyResponse(action, response);
      status.value = await fetchMfaStatus();
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, resolveFallback(action)));
    } finally {
      isSubmitting.value = false;
    }
  }

  function buildPayload(action: MfaAction) {
    if (action === "setup" && !setupForm.code.trim()) {
      return {
        action
      } as const;
    }

    return {
      action,
      code: setupForm.code.trim() || undefined,
      recoveryCode: setupForm.recoveryCode.trim() || undefined
    } as const;
  }

  function applyResponse(action: MfaAction, response: MfaSetupResponse): void {
    status.value = {
      ...status.value,
      enabled: response.enabled,
      pending: response.pending
    };
    setupChallenge.value = response.challenge;
    latestRecoveryCodes.value = response.recoveryCodes;

    if (action === "setup" && response.pending) {
      ElMessage.success("已生成新的身份验证器绑定信息，请用验证码完成确认。");
      return;
    }

    if (action === "setup") {
      setupForm.code = "";
      setupForm.recoveryCode = "";
      ElMessage.success("MFA 已更新。");
      return;
    }

    if (action === "rotate-recovery") {
      setupForm.code = "";
      setupForm.recoveryCode = "";
      ElMessage.success("恢复码已轮换。");
      return;
    }

    setupForm.code = "";
    setupForm.recoveryCode = "";
    latestRecoveryCodes.value = [];
    ElMessage.success("MFA 已关闭。");
  }

  function resolveFallback(action: MfaAction): string {
    if (action === "setup") {
      return setupForm.code.trim() ? "无法确认新的身份验证器绑定，请检查验证码后重试。" : "无法生成新的绑定信息，请稍后重试。";
    }

    if (action === "rotate-recovery") {
      return "无法轮换恢复码，请检查验证码或恢复码。";
    }

    return "无法关闭 MFA，请检查验证码或恢复码。";
  }

  return {
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
  };
}
