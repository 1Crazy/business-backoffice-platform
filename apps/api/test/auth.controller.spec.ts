import { AuthController } from "../src/modules/auth/auth.controller";

describe("AuthController", () => {
  it("delegates login to auth service", async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh"
      })
    } as any;
    const controller = new AuthController(authService);

    const payload = {
      username: "admin",
      password: "Admin123456!"
    };

    await controller.login(payload);

    expect(authService.login).toHaveBeenCalledWith(payload);
  });

  it("delegates profile lookup to auth service", async () => {
    const authService = {
      getProfile: jest.fn().mockResolvedValue({
        id: "user-1"
      })
    } as any;
    const controller = new AuthController(authService);
    const user = {
      id: "user-1",
      sessionId: "session-1"
    } as any;

    await controller.getProfile(user);

    expect(authService.getProfile).toHaveBeenCalledWith("user-1", "session-1");
  });
});
