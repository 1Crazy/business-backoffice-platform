/** 共享 mapper：负责在数据库结果、公共领域对象和对外契约之间做统一转换。 */
export function toIsoString(value?: Date | null): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value.toISOString();
}
