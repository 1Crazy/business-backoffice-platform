import type { OpenAPIObject } from "@nestjs/swagger";

export type OpenApiOperation = Record<string, any> | undefined;

export function getOperation(document: OpenAPIObject, path: string, method: string): OpenApiOperation {
  const pathItem = document.paths?.[path] as Record<string, any> | undefined;
  const operation = pathItem?.[method];

  return operation && typeof operation === "object" ? (operation as Record<string, any>) : undefined;
}

export function getSchemaExample<T = unknown>(document: OpenAPIObject, schemaName: string): T | undefined {
  const schemas = document.components?.schemas as Record<string, any> | undefined;
  return schemas?.[schemaName]?.example as T | undefined;
}

export function setJsonRequestExample(operation: OpenApiOperation, name: string, example: unknown): void {
  const content = operation?.requestBody?.content?.["application/json"];

  if (!content) {
    return;
  }

  content.examples = {
    [name]: {
      value: example
    }
  };
}

export function setJsonSuccessExample(operation: OpenApiOperation, name: string, example: unknown): void {
  const content = operation?.responses?.["200"]?.content?.["application/json"];

  if (!content || example === undefined) {
    return;
  }

  content.examples = {
    [name]: {
      value: example
    }
  };
}

export function setMultipartRequestExample(operation: OpenApiOperation, name: string, example: unknown): void {
  const content = operation?.requestBody?.content?.["multipart/form-data"];

  if (!content) {
    return;
  }

  content.examples = {
    [name]: {
      value: example
    }
  };
}

export function setJsonErrorExample(
  operation: OpenApiOperation,
  statusCode: 400 | 401 | 403 | 404,
  name: string,
  example: unknown
): void {
  const content = operation?.responses?.[String(statusCode)]?.content?.["application/json"];

  if (!content) {
    return;
  }

  content.examples = {
    [name]: {
      value: example
    }
  };
}

function httpErrorName(statusCode: 400 | 401 | 403 | 404): string {
  if (statusCode === 400) {
    return "BadRequestException";
  }

  if (statusCode === 401) {
    return "UnauthorizedException";
  }

  if (statusCode === 403) {
    return "ForbiddenException";
  }

  return "NotFoundException";
}

export function applyStandardErrorExample(
  operation: OpenApiOperation,
  statusCode: 400 | 401 | 403 | 404,
  path: string,
  message: string
): void {
  setJsonErrorExample(operation, statusCode, `HTTP ${statusCode}`, {
    statusCode,
    message,
    error: httpErrorName(statusCode),
    path,
    timestamp: "2026-05-04T11:13:42.000Z"
  });
}
