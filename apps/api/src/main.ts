/** 应用入口：负责初始化 NestJS 容器、全局中间件和 Swagger 文档。 */
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";

import { AppModule } from "./app.module";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import {
  assertRuntimeSecurityConfig,
  getAllowedCorsOrigins,
  getSwaggerBasicAuth,
  shouldEnableSwagger
} from "./common/security/security-config.util";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  assertRuntimeSecurityConfig(configService);
  app.enableShutdownHooks();

  app.enableCors({
    origin: getAllowedCorsOrigins(configService),
    credentials: true
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  if (shouldEnableSwagger(configService)) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Business Platform API")
      .setDescription("Shared API for multi-application business back-office services")
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const swaggerBasicAuth = getSwaggerBasicAuth(configService);
    if (swaggerBasicAuth) {
      // 非本地环境即使显式开启 Swagger，也必须先经过反向代理前的最小访问控制。
      app.use(["/docs", "/docs-json"], (request: Request, response: Response, next: NextFunction) => {
        const authorization = request.headers.authorization;
        const expected = `Basic ${Buffer.from(`${swaggerBasicAuth.username}:${swaggerBasicAuth.password}`).toString("base64")}`;

        if (authorization === expected) {
          next();
          return;
        }

        response.setHeader("WWW-Authenticate", "Basic realm=\"Swagger\"");
        response.status(401).send("Authentication required.");
      });
    }
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(port, "0.0.0.0");
}

bootstrap();
