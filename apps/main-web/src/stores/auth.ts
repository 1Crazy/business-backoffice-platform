/** 前端 store：维护主应用统一登录态，供宿主导航与权限判断复用。 */
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { clearStoredSession, getStoredSession, storeSession } from "@/auth/session";
import { fetchCurrentUserProfile, loginByPassword, logoutCurrentSession } from "@/api/auth.api";
import type { CurrentUser } from "@/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const initialSession = getStoredSession();
  const token = ref<string | null>(initialSession.accessToken);
  const refreshToken = ref<string | null>(initialSession.refreshToken);
  const currentUser = ref<CurrentUser | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(username: string, password: string): Promise<void> {
    const data = await loginByPassword({ username, password });

    token.value = data.accessToken;
    refreshToken.value = data.refreshToken;
    currentUser.value = data.user;
    storeSession(data.accessToken, data.refreshToken, data.sessionExpiresAt);
  }

  async function fetchProfile(): Promise<void> {
    if (!token.value) {
      currentUser.value = null;
      return;
    }

    currentUser.value = await fetchCurrentUserProfile();
  }

  async function logout(): Promise<void> {
    if (token.value) {
      try {
        await logoutCurrentSession();
      } catch {
        // 会话已失效时，主应用仍要确保本地状态被清理，避免宿主菜单残留旧权限。
      }
    }

    token.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    clearStoredSession();
  }

  function hasPermission(permission: string): boolean {
    // 外部会话恢复或联调 mock 可能缺少 permissions 字段，权限判断必须失败关闭而不是白屏。
    return currentUser.value?.permissions?.includes(permission) ?? false;
  }

  return {
    token,
    refreshToken,
    currentUser,
    isAuthenticated,
    login,
    fetchProfile,
    logout,
    hasPermission
  };
});
