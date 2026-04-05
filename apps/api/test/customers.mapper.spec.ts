import { mapCustomer, mapCustomerFollowUp } from "../src/modules/customers/mappers/customers.mapper";

describe("customers.mapper", () => {
  it("maps customer details into response contract with ISO strings", () => {
    const result = mapCustomer({
      id: "customer-1",
      name: "Beta Corp",
      contactName: "王强",
      phone: "13800000000",
      email: "beta@example.com",
      source: "website",
      status: "active",
      notes: "重点客户",
      ownerId: "owner-1",
      owner: {
        id: "owner-1",
        username: "sales",
        displayName: "销售甲",
        email: null,
        phone: null,
        status: "ACTIVE",
        departmentId: "dept-1"
      },
      tags: [
        {
          tag: {
            id: "tag-1",
            name: "VIP",
            color: "#f59e0b"
          }
        }
      ],
      attachments: [
        {
          id: "attachment-1",
          businessType: "CUSTOMER",
          businessId: "customer-1",
          fileName: "stored.pdf",
          originalName: "contract.pdf",
          mimeType: "application/pdf",
          size: 1024,
          createdAt: new Date("2026-04-05T08:00:00.000Z")
        }
      ],
      createdAt: new Date("2026-04-05T08:00:00.000Z"),
      updatedAt: new Date("2026-04-05T09:00:00.000Z")
    } as any);

    expect(result).toMatchObject({
      id: "customer-1",
      attachments: [
        {
          id: "attachment-1",
          createdAt: "2026-04-05T08:00:00.000Z"
        }
      ],
      createdAt: "2026-04-05T08:00:00.000Z",
      updatedAt: "2026-04-05T09:00:00.000Z"
    });
  });

  it("maps customer follow-ups with reminder contract", () => {
    const result = mapCustomerFollowUp({
      id: "follow-1",
      content: "继续跟进",
      nextFollowUpAt: new Date("2026-04-06T10:00:00.000Z"),
      createdAt: new Date("2026-04-05T08:00:00.000Z"),
      createdBy: {
        id: "user-1",
        username: "sales",
        displayName: "销售甲",
        email: null,
        phone: null,
        status: "ACTIVE",
        departmentId: "dept-1"
      },
      reminder: {
        id: "reminder-1",
        remindAt: new Date("2026-04-06T10:00:00.000Z"),
        status: "PENDING"
      }
    } as any);

    expect(result).toMatchObject({
      id: "follow-1",
      nextFollowUpAt: "2026-04-06T10:00:00.000Z",
      reminder: {
        id: "reminder-1",
        remindAt: "2026-04-06T10:00:00.000Z"
      }
    });
  });
});
