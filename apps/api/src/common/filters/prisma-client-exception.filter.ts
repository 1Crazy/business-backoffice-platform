/** 全局异常过滤器：负责把底层 Prisma 异常转换为稳定的 HTTP 错误响应。 */
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

import { translateErrorPayload } from "@/common/errors/error-message.util";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const { statusCode, message } = this.mapException(exception);

    response.status(statusCode).json({
      statusCode,
      message: translateErrorPayload(message),
      errorCode: exception.code,
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }

  private mapException(exception: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    switch (exception.code) {
      case "P2002":
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "记录已存在，请检查唯一字段后重试。"
        };
      case "P2003":
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "提交的数据关联关系无效，请重新选择后再试。"
        };
      case "P2025":
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: "目标记录不存在或已被删除。"
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "数据请求无效，请检查输入后重试。"
        };
    }
  }
}
