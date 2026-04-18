/** 细粒度策略工具：负责把 JSON 策略转换为稳定的共享结构，避免业务层反复手写容错逻辑。 */
import type {
  ActionPermissionRule,
  ExtendedDataScopeRule,
  FieldPermissionRule,
  PolicyDimension,
  FieldVisibility
} from "./access-policy.types";

const POLICY_DIMENSIONS = new Set<PolicyDimension>(["TEAM", "REGION", "CUSTOMER_POOL", "CUSTOM"]);
const FIELD_VISIBILITIES = new Set<FieldVisibility>(["READ_WRITE", "READONLY", "MASKED", "HIDDEN"]);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => normalizeText(item)).filter(Boolean)));
}

export function readExtendedDataScopeRules(value: unknown): ExtendedDataScopeRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ExtendedDataScopeRule[]>((rules, item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return rules;
      }

      const record = item as Record<string, unknown>;
      const dimension = normalizeText(record.dimension) as PolicyDimension;

      if (!POLICY_DIMENSIONS.has(dimension)) {
        return rules;
      }

      const values = normalizeStringList(record.values);

      if (values.length === 0) {
        return rules;
      }

      const note = normalizeText(record.note);

      rules.push({
        dimension,
        values,
        note: note || null
      });

      return rules;
    }, []);
}

export function readFieldPermissionRules(value: unknown): FieldPermissionRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const resource = normalizeText(record.resource);
      const field = normalizeText(record.field);
      const visibility = normalizeText(record.visibility) as FieldVisibility;

      if (!resource || !field || !FIELD_VISIBILITIES.has(visibility)) {
        return null;
      }

      return {
        resource,
        field,
        visibility
      };
    })
    .filter((item): item is FieldPermissionRule => item !== null);
}

export function readActionPermissionRules(value: unknown): ActionPermissionRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const resource = normalizeText(record.resource);
      const action = normalizeText(record.action);

      if (!resource || !action || typeof record.allowed !== "boolean") {
        return null;
      }

      return {
        resource,
        action,
        allowed: record.allowed
      };
    })
    .filter((item): item is ActionPermissionRule => item !== null);
}
