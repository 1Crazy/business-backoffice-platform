import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";

import { ApiErrorResponseVo } from "../vo/api-error.vo";

type CommonErrorResponseOptions = {
  badRequest?: string;
  unauthorized?: string;
  forbidden?: string;
  notFound?: string;
};

/** 为常规业务接口统一挂载常见错误响应说明，避免每个 controller 手写重复注解。 */
export function ApiCommonErrorResponses(options: CommonErrorResponseOptions = {}) {
  const decorators = [];

  if (options.badRequest !== null) {
    decorators.push(
      ApiBadRequestResponse({
        description: options.badRequest ?? "请求参数不合法、缺少必要字段，或业务前置校验未通过。",
        type: ApiErrorResponseVo
      })
    );
  }

  if (options.unauthorized !== null) {
    decorators.push(
      ApiUnauthorizedResponse({
        description: options.unauthorized ?? "当前请求未携带有效登录身份，或登录状态已失效。",
        type: ApiErrorResponseVo
      })
    );
  }

  if (options.forbidden !== null) {
    decorators.push(
      ApiForbiddenResponse({
        description: options.forbidden ?? "当前账号缺少所需权限、数据范围，或未通过安全校验。",
        type: ApiErrorResponseVo
      })
    );
  }

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: options.notFound,
        type: ApiErrorResponseVo
      })
    );
  }

  return applyDecorators(...decorators);
}
