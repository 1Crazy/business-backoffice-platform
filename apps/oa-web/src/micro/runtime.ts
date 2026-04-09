/** 微前端运行时：集中管理 OA 子应用的宿主模式判断与 router base 计算。 */
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

const OA_HOST_BASE = "/oa";

export function isMicroAppMode(): boolean {
  return Boolean(qiankunWindow.__POWERED_BY_QIANKUN__);
}

export function getMicroAppRouterBase(): string {
  return isMicroAppMode() ? OA_HOST_BASE : "/";
}

export {};
