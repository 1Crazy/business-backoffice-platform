import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { http } from "../api/http";
import type { CurrentUser, LoginResponse } from "../types/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(window.localStorage.getItem("scrm-token"));
  const currentUser = ref<CurrentUser | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(username: string, password: string): Promise<void> {
    const { data } = await http.post<LoginResponse>("/auth/login", { username, password });
    token.value = data.accessToken;
    currentUser.value = data.user;
    window.localStorage.setItem("scrm-token", data.accessToken);
  }

  async function fetchProfile(): Promise<void> {
    if (!token.value) {
      currentUser.value = null;
      return;
    }

    const { data } = await http.get<CurrentUser>("/auth/profile");
    currentUser.value = data;
  }

  function logout(): void {
    token.value = null;
    currentUser.value = null;
    window.localStorage.removeItem("scrm-token");
  }

  function hasPermission(permission: string): boolean {
    return currentUser.value?.permissions.includes(permission) ?? false;
  }

  return {
    token,
    currentUser,
    isAuthenticated,
    login,
    fetchProfile,
    logout,
    hasPermission
  };
});

