import { BadRequestException, HttpException, HttpStatus } from "@nestjs/common";

import { HttpExceptionFilter, UnknownExceptionFilter } from "../src/common/filters/http-exception.filter";

function createHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));

  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({
          status
        }),
        getRequest: () => ({
          url: "/api/test"
        })
      })
    } as any,
    status,
    json
  };
}

describe("HttpExceptionFilter", () => {
  it("translates string exception messages", () => {
    const { host, status, json } = createHost();
    const filter = new HttpExceptionFilter();

    filter.catch(new HttpException("Invalid credentials.", HttpStatus.UNAUTHORIZED), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "账号或密码错误。"
      })
    );
  });

  it("translates object payload messages", () => {
    const { host, json } = createHost();
    const filter = new HttpExceptionFilter();

    filter.catch(new BadRequestException(["MFA code is invalid."]), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: ["身份验证器验证码或恢复码无效。"]
      })
    );
  });
});

describe("UnknownExceptionFilter", () => {
  it("returns a chinese internal error message", () => {
    const { host, status, json } = createHost();
    const filter = new UnknownExceptionFilter();

    filter.catch(new Error("boom"), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "系统内部发生异常，请稍后重试。"
      })
    );
  });
});
