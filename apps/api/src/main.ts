/** 应用入口：负责初始化 NestJS 容器、全局中间件和 Swagger 文档。 */
import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import {
  assertRuntimeSecurityConfig,
  getAllowedCorsOrigins,
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
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(port, "0.0.0.0");
}

bootstrap();
