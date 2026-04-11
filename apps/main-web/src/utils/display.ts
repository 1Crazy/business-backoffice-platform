/** 展示文案工具：负责把通用状态值转换成中文界面文案。 */
const ACCESS_STATUS_LABELS: Record<"ACTIVE" | "DISABLED", string> = {
  ACTIVE: "启用",
  DISABLED: "停用"
};

export function formatAccessStatus(value?: "ACTIVE" | "DISABLED" | string | null): string {
  if (!value) {
    return "-";
  }

  return ACCESS_STATUS_LABELS[value as "ACTIVE" | "DISABLED"] ?? value;
}
