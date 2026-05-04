import { translateErrorMessage, translateErrorPayload } from "../src/common/errors/error-message.util";

describe("error message translation", () => {
  it("translates exact english auth messages", () => {
    expect(translateErrorMessage("Invalid credentials.")).toBe("账号或密码错误。");
    expect(translateErrorMessage("MFA code is invalid.")).toBe("身份验证器验证码或恢复码无效。");
  });

  it("translates password policy details into chinese", () => {
    expect(
      translateErrorMessage("Password does not meet the complexity policy: at least 12 characters, an uppercase letter, a number.")
    ).toBe("密码复杂度不符合要求：至少 12 位，至少一个大写字母，至少一个数字。");
  });

  it("translates array payloads recursively", () => {
    expect(
      translateErrorPayload([
        "Invalid credentials.",
        "Too many failed attempts. Please try again later."
      ])
    ).toEqual(["账号或密码错误。", "失败次数过多，请稍后再试。"]);
  });

  it("translates validator default messages", () => {
    expect(translateErrorMessage("code must be a string")).toBe("验证码格式不正确。");
    expect(translateErrorMessage("property refreshToken should not exist")).toBe("请求参数中不应包含字段 刷新令牌。");
  });
});
