/** 细粒度策略服务：负责统一处理动作限制、字段脱敏与字段写入校验。 */
import { ForbiddenException, Injectable } from "@nestjs/common";

import type { AuthUser } from "../auth/auth-user.interface";
import type { ActionPermissionRule, FieldPermissionRule, FieldVisibility } from "./access-policy.types";

const FIELD_VISIBILITY_PRIORITY: Record<FieldVisibility, number> = {
  READ_WRITE: 1,
  READONLY: 2,
  MASKED: 3,
  HIDDEN: 4
};

const DEFAULT_PII_FIELD_RULES: FieldPermissionRule[] = [
  { resource: "customer", field: "contactName", visibility: "MASKED" },
  { resource: "customer", field: "phone", visibility: "MASKED" },
  { resource: "customer", field: "email", visibility: "MASKED" },
  { resource: "customer", field: "owner.email", visibility: "HIDDEN" },
  { resource: "customer", field: "owner.phone", visibility: "HIDDEN" },
  { resource: "lead", field: "contactName", visibility: "MASKED" },
  { resource: "lead", field: "phone", visibility: "MASKED" },
  { resource: "lead", field: "owner.email", visibility: "HIDDEN" },
  { resource: "lead", field: "owner.phone", visibility: "HIDDEN" },
  { resource: "opportunity", field: "customer.contactName", visibility: "MASKED" },
  { resource: "opportunity", field: "customer.phone", visibility: "MASKED" },
  { resource: "opportunity", field: "sourceLead.contactName", visibility: "MASKED" },
  { resource: "opportunity", field: "sourceLead.phone", visibility: "MASKED" },
  { resource: "user", field: "email", visibility: "MASKED" },
  { resource: "user", field: "phone", visibility: "MASKED" },
  { resource: "audit-log", field: "actorName", visibility: "MASKED" },
  { resource: "payment-record", field: "note", visibility: "MASKED" },
  { resource: "renewal-reminder", field: "note", visibility: "MASKED" }
];

@Injectable()
export class AccessPolicyService {
  assertActionAllowed(
    actor: AuthUser,
    resource: string,
    action: string,
    message = "You do not have permission to perform this action."
  ) {
    const matchedRules = (actor.actionPermissionRules ?? []).filter(
      (rule) => this.matchesResource(rule.resource, resource) && this.matchesResource(rule.action, action)
    );

    if (matchedRules.some((rule) => rule.allowed === false)) {
      throw new ForbiddenException(message);
    }
  }

  assertWritableFields(
    actor: AuthUser,
    resource: string,
    payload: Record<string, unknown>,
    messageBuilder?: (field: string) => string
  ) {
    const effectiveRules = this.collectEffectiveFieldRules(actor, resource);

    for (const rule of effectiveRules) {
      if (rule.visibility === "READ_WRITE") {
        continue;
      }

      if (this.hasDefinedPathValue(payload, rule.field)) {
        throw new ForbiddenException(messageBuilder?.(rule.field) ?? `You cannot edit restricted field "${rule.field}".`);
      }
    }
  }

  sanitizeReadFields<T>(actor: AuthUser, resource: string, payload: T): T {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const effectiveRules = this.collectEffectiveFieldRules(actor, resource).filter(
      (rule) => rule.visibility === "MASKED" || rule.visibility === "HIDDEN"
    );

    if (effectiveRules.length === 0) {
      return payload;
    }

    const clonedPayload = JSON.parse(JSON.stringify(payload)) as T;

    for (const rule of effectiveRules) {
      this.applyFieldVisibility(clonedPayload as Record<string, unknown>, rule.field, rule.visibility);
    }

    return clonedPayload;
  }

  private collectEffectiveFieldRules(actor: AuthUser, resource: string): FieldPermissionRule[] {
    const ruleMap = new Map<string, FieldPermissionRule>();

    for (const rule of DEFAULT_PII_FIELD_RULES) {
      if (!this.matchesResource(rule.resource, resource)) {
        continue;
      }

      ruleMap.set(rule.field, rule);
    }

    for (const rule of actor.fieldPermissionRules ?? []) {
      if (!this.matchesResource(rule.resource, resource)) {
        continue;
      }

      ruleMap.set(rule.field, rule);
    }

    return Array.from(ruleMap.values());
  }

  private matchesResource(ruleValue: string, actualValue: string): boolean {
    return ruleValue === "*" || ruleValue === actualValue;
  }

  private hasDefinedPathValue(payload: Record<string, unknown>, fieldPath: string): boolean {
    const segments = fieldPath.split(".").filter(Boolean);

    return this.readPathState(payload, segments) === "defined";
  }

  private readPathState(target: unknown, segments: string[]): "defined" | "missing" {
    if (!segments.length) {
      return target === undefined ? "missing" : "defined";
    }

    if (Array.isArray(target)) {
      return target.some((item) => this.readPathState(item, segments) === "defined") ? "defined" : "missing";
    }

    if (!target || typeof target !== "object") {
      return "missing";
    }

    const [currentSegment, ...restSegments] = segments;
    const nextValue = (target as Record<string, unknown>)[currentSegment];

    return this.readPathState(nextValue, restSegments);
  }

  private applyFieldVisibility(target: Record<string, unknown>, fieldPath: string, visibility: FieldVisibility) {
    const segments = fieldPath.split(".").filter(Boolean);

    if (!segments.length) {
      return;
    }

    this.walkFieldPath(target, segments, visibility);
  }

  private walkFieldPath(target: unknown, segments: string[], visibility: FieldVisibility) {
    if (Array.isArray(target)) {
      for (const item of target) {
        this.walkFieldPath(item, segments, visibility);
      }

      return;
    }

    if (!target || typeof target !== "object") {
      return;
    }

    const [currentSegment, ...restSegments] = segments;
    const currentRecord = target as Record<string, unknown>;

    if (restSegments.length === 0) {
      if (!(currentSegment in currentRecord)) {
        return;
      }

      currentRecord[currentSegment] =
        visibility === "HIDDEN" ? undefined : this.maskValue(currentRecord[currentSegment]);
      return;
    }

    this.walkFieldPath(currentRecord[currentSegment], restSegments, visibility);
  }

  private maskValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      if (value.includes("@")) {
        const [localPart, domainPart] = value.split("@");

        if (!domainPart) {
          return "***";
        }

        return `${localPart.slice(0, 1) || "*"}***@${domainPart}`;
      }

      if (/^\d{11}$/.test(value)) {
        return `${value.slice(0, 3)}****${value.slice(-4)}`;
      }

      if (value.length <= 2) {
        return "*".repeat(value.length);
      }

      return `${value.slice(0, 1)}***${value.slice(-1)}`;
    }

    if (typeof value === "number") {
      return null;
    }

    return null;
  }
}
