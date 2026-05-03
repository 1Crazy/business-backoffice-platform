/** 前端 store：负责跨页面共享的会话或状态管理，避免页面重复维护同一份全局状态。 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { clearStoredSession, getStoredSession, storeSession } from "@/auth/session";
import { fetchCurrentUserProfile, loginByPassword, logoutCurrentSession, verifyLoginMfa } from "@/api/auth.api";
import type { CurrentUser, LoginResponse } from "@/types/auth";

interface PendingMfaState {
  ticket: string;
  challengeType: "totp";
  setupChallenge: string | null;
  enrollmentRequired: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const initialSession = getStoredSession();
  const sessionExpiresAt = ref<string | null>(initialSession.sessionExpiresAt);
  const currentUser = ref<CurrentUser | null>(null);
  const pendingMfa = ref<PendingMfaState | null>(null);
  const latestRecoveryCodes = ref<string[]>([]);

  const isAuthenticated = computed(() => Boolean(currentUser.value));
  const requiresMfa = computed(() => Boolean(pendingMfa.value));

  async function login(username: string, password: string): Promise<LoginResponse> {
    const data = await loginByPassword({ username, password });
    applyLoginResponse(data);
    return data;
  }

  async function completeMfa(code: string): Promise<LoginResponse> {
    if (!pendingMfa.value) {
      throw new Error("MFA challenge is not pending.");
    }

    const data = await verifyLoginMfa({
      ticket: pendingMfa.value.ticket,
      code
    });
    applyLoginResponse(data);
    return data;
  }

  async function fetchProfile(): Promise<void> {
    if (!sessionExpiresAt.value) {
      currentUser.value = null;
      return;
    }

    currentUser.value = await fetchCurrentUserProfile();
  }

  async function logout(): Promise<void> {
    if (sessionExpiresAt.value || currentUser.value) {
      try {
        await logoutCurrentSession();
      } catch {
        // 会话已失效时，前端仍需要确保本地状态被清理。
      }
    }

    sessionExpiresAt.value = null;
    currentUser.value = null;
    pendingMfa.value = null;
    latestRecoveryCodes.value = [];
    clearStoredSession();
  }

  function hasPermission(permission: string): boolean {
    // 外部会话恢复或联调 mock 可能缺少 permissions 字段，权限判断必须失败关闭而不是白屏。
    return currentUser.value?.permissions?.includes(permission) ?? false;
  }

  function clearPendingMfa(): void {
    pendingMfa.value = null;
    latestRecoveryCodes.value = [];
  }

  function applyLoginResponse(data: LoginResponse): void {
    if (data.success) {
      pendingMfa.value = null;
      latestRecoveryCodes.value = data.mfaRecoveryCodes;
      sessionExpiresAt.value = data.sessionExpiresAt;
      currentUser.value = data.user;
      storeSession(data.sessionExpiresAt ?? undefined);
      return;
    }

    sessionExpiresAt.value = null;
    currentUser.value = null;
    latestRecoveryCodes.value = [];
    storeSession(undefined);
    pendingMfa.value = {
      ticket: data.mfaTicket ?? "",
      challengeType: "totp",
      setupChallenge: data.mfaSetupChallenge,
      enrollmentRequired: data.mfaEnrollmentRequired
    };
  }

  return {
    sessionExpiresAt,
    currentUser,
    pendingMfa,
    latestRecoveryCodes,
    isAuthenticated,
    requiresMfa,
    login,
    completeMfa,
    clearPendingMfa,
    fetchProfile,
    logout,
    hasPermission
  };
});
