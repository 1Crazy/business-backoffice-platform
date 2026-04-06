/** 前端工具函数：负责提炼跨页面复用的数据归一化和请求辅助逻辑。 */
export function normalizeRequiredText(value: string): string {
  return value.trim();
}

export function normalizeOptionalTextForCreate(value: string | null | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeOptionalTextForUpdate(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeStringList(values: string[]): string[] {
  return values.map((item) => item.trim()).filter(Boolean);
}

export function normalizeOptionalArray(values: string[]): string[] | undefined {
  const normalized = normalizeStringList(values);
  return normalized.length ? normalized : undefined;
}
