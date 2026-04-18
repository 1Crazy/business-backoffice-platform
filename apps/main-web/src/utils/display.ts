/** 展示文案工具：负责把通用状态值转换成中文界面文案。 */
const ACCESS_STATUS_LABELS: Record<"ACTIVE" | "DISABLED", string> = {
  ACTIVE: "启用",
  DISABLED: "停用"
};

const DATA_SCOPE_LABELS: Record<"SELF" | "DEPARTMENT" | "DEPARTMENT_AND_SUBTREE" | "ALL", string> = {
  SELF: "仅本人",
  DEPARTMENT: "本部门",
  DEPARTMENT_AND_SUBTREE: "部门及下级",
  ALL: "全部数据"
};

function padDateTimePart(value: number): string {
  return String(value).padStart(2, "0");
}

function buildDateTimeString(value: Date): string {
  return [
    `${value.getFullYear()}-${padDateTimePart(value.getMonth() + 1)}-${padDateTimePart(value.getDate())}`,
    `${padDateTimePart(value.getHours())}:${padDateTimePart(value.getMinutes())}:${padDateTimePart(value.getSeconds())}`
  ].join(" ");
}

function normalizeLocalDateTimeString(value: string): string | null {
  const trimmedValue = value.trim();
  const dateOnlyMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})$/);

  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]} 00:00:00`;
  }

  const localDateTimeMatch = trimmedValue.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d{1,3})?$/
  );

  if (localDateTimeMatch) {
    return `${localDateTimeMatch[1]} ${localDateTimeMatch[2]}:${localDateTimeMatch[3] ?? "00"}`;
  }

  return null;
}

export function formatAccessStatus(value?: "ACTIVE" | "DISABLED" | string | null): string {
  if (!value) {
    return "-";
  }

  return ACCESS_STATUS_LABELS[value as "ACTIVE" | "DISABLED"] ?? value;
}

export function formatDataScope(value?: "SELF" | "DEPARTMENT" | "DEPARTMENT_AND_SUBTREE" | "ALL" | string | null): string {
  if (!value) {
    return "-";
  }

  return DATA_SCOPE_LABELS[value as "SELF" | "DEPARTMENT" | "DEPARTMENT_AND_SUBTREE" | "ALL"] ?? value;
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const normalizedValue = normalizeLocalDateTimeString(value);

  if (normalizedValue) {
    return normalizedValue;
  }

  const parsedValue = new Date(value);

  if (Number.isNaN(parsedValue.getTime())) {
    return value;
  }

  return buildDateTimeString(parsedValue);
}
