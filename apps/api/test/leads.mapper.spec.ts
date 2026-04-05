import { mapLeadReminder } from "../src/modules/leads/mappers/leads.mapper";

describe("leads.mapper", () => {
  it("maps reminder aggregates into the explicit reminder contract", () => {
    const result = mapLeadReminder({
      id: "reminder-1",
      entityType: "LEAD",
      status: "PENDING",
      remindAt: new Date("2026-04-05T10:00:00.000Z"),
      lead: {
        id: "lead-1",
        name: "Acme 潜客",
        contactName: "王强",
        phone: "13800000000"
      },
      customer: null,
      followUp: {
        id: "follow-1",
        content: "继续跟进",
        nextFollowUpAt: new Date("2026-04-06T10:00:00.000Z")
      },
      owner: {
        id: "user-1",
        username: "sales",
        displayName: "销售甲",
        email: null,
        phone: null,
        status: "ACTIVE",
        departmentId: "dept-1"
      },
      createdAt: new Date("2026-04-05T08:00:00.000Z"),
      updatedAt: new Date("2026-04-05T09:00:00.000Z")
    } as any);

    expect(result).toMatchObject({
      id: "reminder-1",
      remindAt: "2026-04-05T10:00:00.000Z",
      followUp: {
        nextFollowUpAt: "2026-04-06T10:00:00.000Z"
      },
      owner: {
        displayName: "销售甲"
      }
    });
  });
});
