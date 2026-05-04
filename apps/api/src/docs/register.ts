import { ConfigService } from "@nestjs/config";
import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import type { NextFunction, Request, Response } from "express";

import { getSwaggerBasicAuth } from "../common/security/security-config.util";
import { API_REFERENCE_PATH, API_REFERENCE_SPEC_PATH, SWAGGER_DEBUG_PATH } from "./constants";
import { applyCoreOpenApiExamples } from "./core/examples";
import { CORE_SCHEMA_DESCRIPTIONS } from "./core/descriptions";
import { applyOaOpenApiExamples } from "./oa/examples";
import { OA_SCHEMA_DESCRIPTIONS } from "./oa/descriptions";
import { buildDocsOverviewMarkdown, buildTagGroups, getTagMetadata, getTranslatedTagName } from "./portal";
import { applyPlatformOpenApiExamples } from "./platform/examples";
import { PLATFORM_SCHEMA_DESCRIPTIONS } from "./platform/descriptions";
import { applyScrmOpenApiExamples } from "./scrm/examples";
import { SCRM_SCHEMA_DESCRIPTIONS } from "./scrm/descriptions";
import { applySchemaDescriptionModules } from "./shared/schema-descriptions";

export function registerApiDocs(app: INestApplication, configService: ConfigService): OpenAPIObject {
  const document = enhanceOpenApiDocument(createOpenApiDocument(app));
  useDocsBasicAuth(app, configService);

  SwaggerModule.setup(SWAGGER_DEBUG_PATH, app, document, {
    jsonDocumentUrl: API_REFERENCE_SPEC_PATH,
    customSiteTitle: "Business Platform API Debug",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list",
      defaultModelsExpandDepth: -1,
      filter: true,
      tryItOutEnabled: true
    }
  });

  app.use(
    API_REFERENCE_PATH,
    apiReference({
      url: API_REFERENCE_SPEC_PATH,
      theme: "bluePlanet",
      layout: "modern",
      defaultHttpClient: {
        targetKey: "js",
        clientKey: "fetch"
      },
      persistAuth: true,
      hideClientButton: false,
      hideDarkModeToggle: false,
      hideModels: false,
      documentDownloadType: "json",
      operationTitleSource: "summary",
      orderSchemaPropertiesBy: "preserve",
      searchHotKey: "k",
      metaData: {
        title: "业务中台 API 文档",
        description: "面向前端联调、内部集成与问题排查的企业内部文档门户"
      },
      authentication: {
        preferredSecurityScheme: "bearer"
      }
    })
  );

  return document;
}

export function enhanceOpenApiDocument(document: OpenAPIObject): OpenAPIObject {
  const extensibleDocument = document as OpenAPIObject & {
    "x-tagGroups"?: ReturnType<typeof buildTagGroups>;
  };

  document.info = {
    ...document.info,
    title: "业务中台 API 文档",
    description: buildDocsOverviewMarkdown()
  };
  extensibleDocument["x-tagGroups"] = buildTagGroups();
  document.tags = getTagMetadata().map((item) => ({
    name: item.name,
    description: item.description
  }));

  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (!operation || typeof operation !== "object" || !("tags" in operation)) {
        continue;
      }

      const tags = Array.isArray(operation.tags) ? operation.tags : [];
      operation.tags = Array.from(new Set(tags.map((tag: string) => getTranslatedTagName(tag))));
    }
  }

  applySchemaDescriptionModules(
    document,
    CORE_SCHEMA_DESCRIPTIONS,
    SCRM_SCHEMA_DESCRIPTIONS,
    OA_SCHEMA_DESCRIPTIONS,
    PLATFORM_SCHEMA_DESCRIPTIONS
  );
  applyCoreOpenApiExamples(document);
  applyScrmOpenApiExamples(document);
  applyOaOpenApiExamples(document);
  applyPlatformOpenApiExamples(document);

  return document;
}

export function useDocsBasicAuth(app: Pick<INestApplication, "use">, configService: ConfigService): void {
  const swaggerBasicAuth = getSwaggerBasicAuth(configService);

  if (!swaggerBasicAuth) {
    return;
  }

  app.use(
    [API_REFERENCE_PATH, API_REFERENCE_SPEC_PATH, SWAGGER_DEBUG_PATH],
    createDocsBasicAuthMiddleware(swaggerBasicAuth.username, swaggerBasicAuth.password)
  );
}

export function createDocsBasicAuthMiddleware(
  username: string,
  password: string
): (request: Request, response: Response, next: NextFunction) => void {
  return (request: Request, response: Response, next: NextFunction) => {
    const authorization = request.headers.authorization;
    const expected = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

    if (authorization === expected) {
      next();
      return;
    }

    response.setHeader("WWW-Authenticate", "Basic realm=\"API Docs\"");
    response.status(401).send("Authentication required.");
  };
}

function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("业务中台 API 文档")
    .setDescription(buildDocsOverviewMarkdown())
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig);
}
