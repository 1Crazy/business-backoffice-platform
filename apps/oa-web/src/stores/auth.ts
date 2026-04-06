/** 前端 store：负责跨页面共享的会话或状态管理，避免页面重复维护同一份全局状态。 */
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
        // 会话已失效时，前端仍需要确保本地状态被清理。
      }
    }

    token.value = null;
    refreshToken.value = null;
    currentUser.value = null;
    clearStoredSession();
  }

  function hasPermission(permission: string): boolean {
    return currentUser.value?.permissions.includes(permission) ?? false;
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
