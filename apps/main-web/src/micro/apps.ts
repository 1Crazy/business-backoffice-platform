/** 子应用注册表：集中维护 entry、激活规则与运行时标识，避免 host 侧散落硬编码。 */
import type { MicroAppName } from "@/types/navigation";

export interface MicroAppDefinition {
  name: MicroAppName;
  entry: string;
  activeRule: string;
}

export const microAppDefinitions: MicroAppDefinition[] = [
  {
    name: "oa-web",
    entry: import.meta.env.VITE_OA_ENTRY ?? "http://localhost:5174",
    activeRule: "/oa"
  },
  {
    name: "scrm-web",
    entry: import.meta.env.VITE_SCRM_ENTRY ?? "http://localhost:5173",
    activeRule: "/scrm"
  }
];
