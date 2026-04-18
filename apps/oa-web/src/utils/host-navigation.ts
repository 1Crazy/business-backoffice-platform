/** 宿主导航工具：负责在独立运行与微前端模式下生成可回到主应用的稳定链接。 */
import { isMicroAppMode } from "@/micro/runtime";
import type { Router } from "vue-router";

const DEFAULT_MAIN_WEB_PORT = "5175";

function resolveStandaloneMainWebOrigin(): string {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_MAIN_WEB_PORT}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_MAIN_WEB_PORT}`;
}

export function getHostAppPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (isMicroAppMode()) {
    return normalizedPath;
  }

  return `${resolveStandaloneMainWebOrigin()}${normalizedPath}`;
}

export function redirectToLoginFromGuard(options?: { allowStandaloneLogin?: boolean }): false | true | string {
  if (isMicroAppMode()) {
    if (typeof window !== "undefined") {
      window.location.assign(getHostAppPath("/login"));
    }

    return false;
  }

  return options?.allowStandaloneLogin ? true : "/login";
}

export async function navigateToLogin(router: Pick<Router, "push">): Promise<void> {
  if (isMicroAppMode()) {
    if (typeof window !== "undefined") {
      window.location.assign(getHostAppPath("/login"));
    }

    return;
  }

  await router.push("/login");
}
