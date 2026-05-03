import { ForbiddenException } from "@nestjs/common";

import { AccessPolicyService } from "../src/common/access-policy/access-policy.service";

describe("AccessPolicyService", () => {
  const service = new AccessPolicyService();

  it("masks and hides configured fields on read models", () => {
    const result = service.sanitizeReadFields(
      {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: [],
        permissions: [],
        fieldPermissionRules: [
          {
            resource: "customer",
            field: "phone",
            visibility: "MASKED"
          },
          {
            resource: "customer",
            field: "email",
            visibility: "HIDDEN"
          }
        ]
      },
      "customer",
      {
        id: "customer-1",
        phone: "13800000000",
        email: "vip@example.com"
      }
    );

    expect(result).toEqual({
      id: "customer-1",
      phone: "138****0000"
    });
  });

  it("applies default pii masking even when no explicit field rule is configured", () => {
    const result = service.sanitizeReadFields(
      {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: [],
        permissions: []
      },
      "customer",
      {
        id: "customer-1",
        contactName: "王小明",
        phone: "13800000000",
        email: "vip@example.com"
      }
    );

    expect(result).toEqual({
      id: "customer-1",
      contactName: "王***明",
      phone: "138****0000",
      email: "v***@example.com"
    });
  });

  it("lets explicit read-write rules override the default pii masking", () => {
    const result = service.sanitizeReadFields(
      {
        id: "user-1",
        username: "alice",
        displayName: "Alice",
        roleCodes: [],
        permissions: [],
        fieldPermissionRules: [
          {
            resource: "customer",
            field: "phone",
            visibility: "READ_WRITE"
          }
        ]
      },
      "customer",
      {
        id: "customer-1",
        phone: "13800000000"
      }
    );

    expect(result).toEqual({
      id: "customer-1",
      phone: "13800000000"
    });
  });

  it("rejects writes to readonly or hidden fields", () => {
    expect(() =>
      service.assertWritableFields(
        {
          id: "user-1",
          username: "alice",
          displayName: "Alice",
          roleCodes: [],
          permissions: [],
          fieldPermissionRules: [
            {
              resource: "lead",
              field: "phone",
              visibility: "READONLY"
            }
          ]
        },
        "lead",
        {
          phone: "13800000000"
        }
      )
    ).toThrow(ForbiddenException);
  });

  it("rejects actions that are explicitly denied by policy", () => {
    expect(() =>
      service.assertActionAllowed(
        {
          id: "user-1",
          username: "alice",
          displayName: "Alice",
          roleCodes: [],
          permissions: [],
          actionPermissionRules: [
            {
              resource: "revenue",
              action: "confirm-payment",
              allowed: false
            }
          ]
        },
        "revenue",
        "confirm-payment"
      )
    ).toThrow(ForbiddenException);
  });
});
