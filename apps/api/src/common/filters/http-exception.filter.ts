import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";

import { translateErrorPayload } from "@/common/errors/error-message.util";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === "string") {
      response.status(statusCode).json({
        statusCode,
        message: translateErrorPayload(exceptionResponse),
        path: request.url,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const normalized = (exceptionResponse ?? {}) as Record<string, unknown>;
    response.status(statusCode).json({
      statusCode,
      ...normalized,
      message: translateErrorPayload(normalized.message ?? exception.message),
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}

@Catch()
export class UnknownExceptionFilter implements ExceptionFilter {
  catch(_exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "系统内部发生异常，请稍后重试。",
      path: request.url,
      timestamp: new Date().toISOString()
    });
  }
}
