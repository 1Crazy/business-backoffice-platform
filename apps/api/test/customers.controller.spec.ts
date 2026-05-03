import { CustomersController } from "../src/modules/customers/customers.controller";

describe("CustomersController", () => {
  it("delegates detail queries to customers service", async () => {
    const customersService = {
      detail: vi.fn().mockResolvedValue({
        id: "customer-1"
      })
    } as any;
    const controller = new CustomersController(customersService);
    const user = {
      id: "user-1"
    } as any;

    await controller.detail("customer-1", user);

    expect(customersService.detail).toHaveBeenCalledWith("customer-1", user);
  });

  it("delegates follow-up creation to customers service", async () => {
    const customersService = {
      createFollowUp: vi.fn().mockResolvedValue({
        id: "follow-1"
      })
    } as any;
    const controller = new CustomersController(customersService);
    const user = {
      id: "user-1"
    } as any;
    const payload = {
      content: "继续跟进",
      nextFollowUpAt: "2026-04-06T10:00:00.000Z"
    };

    await controller.createFollowUp("customer-1", payload, user);

    expect(customersService.createFollowUp).toHaveBeenCalledWith("customer-1", payload, user);
  });
});
