/** 应用入口：负责初始化 NestJS 容器、全局中间件和 API 文档入口。 */
import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter, UnknownExceptionFilter } from "./common/filters/http-exception.filter";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import {
  assertRuntimeSecurityConfig,
  getAllowedCorsOrigins,
  shouldEnableSwagger
} from "./common/security/security-config.util";
import { registerApiDocs } from "./docs";
import { logStartupFailure, logStartupSuccess } from "./startup-diagnostics";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  let app;
  let configService: ConfigService | undefined;
  let port = 3000;
  let docsEnabled = false;

  try {
    app = await NestFactory.create(AppModule);
    const resolvedConfigService = app.get(ConfigService);
    configService = resolvedConfigService;
    port = resolvedConfigService.get<number>("PORT", 3000);
    docsEnabled = shouldEnableSwagger(resolvedConfigService);

    assertRuntimeSecurityConfig(resolvedConfigService);
    app.enableShutdownHooks();

    app.enableCors({
      origin: getAllowedCorsOrigins(resolvedConfigService),
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
    app.useGlobalFilters(new PrismaClientExceptionFilter(), new HttpExceptionFilter(), new UnknownExceptionFilter());

    if (docsEnabled) {
      registerApiDocs(app, resolvedConfigService);
    }

    await app.listen(port, "0.0.0.0");
    logStartupSuccess({ logger, port, docsEnabled });
  } catch (error) {
    logStartupFailure({
      logger,
      error,
      databaseUrl: configService?.get<string>("DATABASE_URL"),
      port,
      docsEnabled
    });
    throw error;
  }
}

bootstrap();
