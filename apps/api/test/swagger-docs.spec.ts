import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";

import {
  API_REFERENCE_PATH,
  API_REFERENCE_SPEC_PATH,
  SWAGGER_DEBUG_PATH,
  createDocsBasicAuthMiddleware,
  enhanceOpenApiDocument,
  registerApiDocs,
  useDocsBasicAuth
} from "../src/docs";

vi.mock("@scalar/nestjs-api-reference", () => ({
  apiReference: vi.fn()
}));

function config(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((key: string, fallback?: string) => values[key] ?? fallback)
  } as unknown as ConfigService;
}

describe("swagger docs", () => {
  it("registers scalar docs and swagger debug docs on the expected routes", () => {
    const use = vi.fn();
    const app = {
      use
    } as any;
    const createDocument = vi.spyOn(SwaggerModule, "createDocument").mockReturnValue({
      openapi: "3.0.0",
      info: { title: "Business Platform API", version: "0.1.0" },
      paths: {}
    } as any);
    const setup = vi.spyOn(SwaggerModule, "setup").mockImplementation(() => undefined);
    const scalarReference = vi.fn(() => "scalar-middleware");
    const scalarSpy = vi.mocked(apiReference);
    scalarSpy.mockImplementation(scalarReference as any);

    registerApiDocs(app, config({ NODE_ENV: "test" }));

    expect(createDocument).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledWith(
      SWAGGER_DEBUG_PATH,
      app,
      expect.objectContaining({ openapi: "3.0.0" }),
      expect.objectContaining({
        jsonDocumentUrl: API_REFERENCE_SPEC_PATH,
        swaggerOptions: expect.objectContaining({
          persistAuthorization: true,
          defaultModelsExpandDepth: -1
        })
      })
    );
    expect(scalarSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: API_REFERENCE_SPEC_PATH,
        operationTitleSource: "summary",
        authentication: {
          preferredSecurityScheme: "bearer"
        }
      })
    );
    expect(use).toHaveBeenCalledWith(API_REFERENCE_PATH, "scalar-middleware");

    createDocument.mockRestore();
    setup.mockRestore();
    scalarSpy.mockReset();
  });

  it("registers basic auth middleware for all docs entrypoints outside local runtime", () => {
    const use = vi.fn();

    useDocsBasicAuth({ use }, config({
      NODE_ENV: "production",
      SWAGGER_ENABLED: "true",
      SWAGGER_BASIC_AUTH_USERNAME: "docs-user",
      SWAGGER_BASIC_AUTH_PASSWORD: "docs-password"
    }));

    expect(use).toHaveBeenCalledTimes(1);
    expect(use.mock.calls[0]?.[0]).toEqual([API_REFERENCE_PATH, API_REFERENCE_SPEC_PATH, SWAGGER_DEBUG_PATH]);
    expect(typeof use.mock.calls[0]?.[1]).toBe("function");
  });

  it("allows authorized docs requests and rejects anonymous ones", () => {
    const middleware = createDocsBasicAuthMiddleware("docs-user", "docs-password");
    const next = vi.fn();
    const setHeader = vi.fn();
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));

    middleware(
      {
        headers: {
          authorization: `Basic ${Buffer.from("docs-user:docs-password").toString("base64")}`
        }
      } as Request,
      { setHeader, status } as unknown as Response,
      next
    );

    expect(next).toHaveBeenCalledTimes(1);

    middleware(
      { headers: {} } as Request,
      { setHeader, status } as unknown as Response,
      vi.fn()
    );

    expect(setHeader).toHaveBeenCalledWith("WWW-Authenticate", 'Basic realm="API Docs"');
    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith("Authentication required.");
  });

  it("translates tag groups and fills common Chinese descriptions", () => {
    const document = enhanceOpenApiDocument({
      openapi: "3.0.0",
      info: {
        title: "raw",
        version: "0.1.0"
      },
      paths: {
        "/api/auth/login": {
          post: {
            tags: ["auth"],
            summary: "账号密码登录",
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "400": {
                content: {
                  "application/json": {}
                }
              },
              "401": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/customers": {
          get: {
            tags: ["customers"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "401": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["customers"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/customers/{id}": {
          get: {
            tags: ["customers"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/leads": {
          get: {
            tags: ["leads"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "401": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["leads"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/leads/{id}": {
          get: {
            tags: ["leads"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/leads/{id}/convert": {
          post: {
            tags: ["leads"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/sales-opportunities": {
          get: {
            tags: ["sales-opportunities"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "401": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["sales-opportunities"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/sales-opportunities/{id}": {
          get: {
            tags: ["sales-opportunities"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/sales-opportunities/{id}/mark-won": {
          patch: {
            tags: ["sales-opportunities"],
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/sales-opportunities/{id}/mark-lost": {
          patch: {
            tags: ["sales-opportunities"],
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/uploads": {
          post: {
            tags: ["uploads"],
            requestBody: {
              content: {
                "multipart/form-data": {}
              }
            }
          }
        },
        "/api/open-api/customers": {
          get: {
            tags: ["open-api"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/open-integration/credentials": {
          post: {
            tags: ["open-integration"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/open-integration/webhooks": {
          post: {
            tags: ["open-integration"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/batch-tasks/customers/import": {
          post: {
            tags: ["batch-tasks"],
            requestBody: {
              content: {
                "multipart/form-data": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "400": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/batch-tasks/{id}": {
          get: {
            tags: ["batch-tasks"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/batch-tasks/{id}/failures": {
          get: {
            tags: ["batch-tasks"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/workflows/tasks/pending": {
          get: {
            tags: ["workflows"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/workflows/tasks/{taskId}/approve": {
          post: {
            tags: ["workflows"],
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "403": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/workflows/tasks/{taskId}/reject": {
          post: {
            tags: ["workflows"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/workflows/templates/{id}/start": {
          post: {
            tags: ["workflows"],
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/workflows/instances/{id}": {
          get: {
            tags: ["workflows"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/notification-center/notifications": {
          get: {
            tags: ["notification-center"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/notification-center/notifications/{id}/read": {
          post: {
            tags: ["notification-center"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/notification-center/preferences": {
          put: {
            tags: ["notification-center"],
            requestBody: {
              content: {
                "application/json": {}
              }
            },
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/users": {
          get: {
            tags: ["users"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["users"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/users/{id}": {
          patch: {
            tags: ["users"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/users/{id}/enable": {
          patch: {
            tags: ["users"],
            responses: {
              "403": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/users/{id}/disable": {
          patch: {
            tags: ["users"],
            responses: {
              "403": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/roles": {
          get: {
            tags: ["roles"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["roles"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/roles/permissions/catalog": {
          get: {
            tags: ["roles"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/roles/{id}": {
          patch: {
            tags: ["roles"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/departments": {
          get: {
            tags: ["departments"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          },
          post: {
            tags: ["departments"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/departments/{id}": {
          patch: {
            tags: ["departments"],
            requestBody: {
              content: {
                "application/json": {}
              }
            }
          }
        },
        "/api/open-integration/webhooks/{id}/deliveries": {
          get: {
            tags: ["open-integration"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/open-integration/webhooks/{id}/test": {
          post: {
            tags: ["open-integration"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        },
        "/api/open-integration/credentials/{id}/rotate": {
          post: {
            tags: ["open-integration"],
            responses: {
              "200": {
                content: {
                  "application/json": {}
                }
              },
              "403": {
                content: {
                  "application/json": {}
                }
              },
              "404": {
                content: {
                  "application/json": {}
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          ApiErrorResponseVo: {
            type: "object",
            properties: {}
          },
          CurrentUserVo: {
            type: "object",
            properties: {
              dataScopes: {},
              roleCodes: {},
              permissions: {}
            }
          },
          LoginResponseVo: {
            type: "object",
            properties: {
              user: {},
              sessionExpiresAt: {},
              success: {}
            }
          },
          PaginatedCustomersResponseVo: {
            type: "object",
            properties: {}
          },
          PaginatedLeadsResponseVo: {
            type: "object",
            properties: {}
          },
          PaginatedSalesOpportunitiesResponseVo: {
            type: "object",
            properties: {}
          },
          DataScope: {
            type: "string",
            enum: ["SELF", "DEPARTMENT", "DEPARTMENT_AND_SUBTREE", "ALL"]
          },
          LeadVo: {
            type: "object",
            properties: {
              status: {}
            }
          },
          LeadReminderVo: {
            type: "object",
            properties: {
              status: {}
            }
          },
          SalesOpportunityVo: {
            type: "object",
            properties: {
              stage: {},
              resultStatus: {}
            }
          },
          AttachmentVo: {
            type: "object",
            properties: {
              businessType: {}
            }
          },
          UserVo: {
            type: "object",
            properties: {
              id: {}
            }
          },
          RoleVo: {
            type: "object",
            properties: {
              id: {}
            }
          },
          DepartmentVo: {
            type: "object",
            properties: {
              id: {}
            }
          },
          NotificationRecordVo: {
            type: "object",
            properties: {
              id: {}
            }
          },
          OpenApiCredentialVo: {
            type: "object",
            properties: {
              id: {}
            }
          },
          WebhookDeliveryVo: {
            type: "object",
            properties: {
              id: {}
            }
          }
        }
      }
    } as any);

    expect(document.info.title).toBe("业务中台 API 文档");
    expect(document.info.description).toContain("文档定位");
    expect(document.info.description).toContain("3 分钟上手");
    expect(document.info.description).toContain("推荐阅读顺序");
    expect(document.info.description).toContain("联调前检查");
    expect(document.info.description).toContain("联调剧本入口");
    expect(document.info.description).toContain("常见问题：`/docs` 打不开");
    expect((document as any)["x-tagGroups"]?.[0]?.name).toBe("开始联调");
    expect(document.tags?.some((tag) => tag.name === "认证与会话")).toBe(true);
    expect(document.tags?.find((tag) => tag.name === "认证与会话")?.description).toContain("/api/auth/login");
    expect(document.tags?.find((tag) => tag.name === "线索管理")?.description).toContain("转客户");
    expect(document.paths["/api/auth/login"]?.post?.tags).toEqual(["认证与会话"]);
    const loginResponseSchema = document.components?.schemas?.LoginResponseVo as any;

    expect(loginResponseSchema?.properties?.user?.description).toBe(
      "当前登录用户资料；仅在登录成功后返回。"
    );
    expect(loginResponseSchema?.properties?.success?.description).toBe("是否执行成功。");
    expect((document.components?.schemas as any)?.ApiErrorResponseVo?.example?.statusCode).toBe(403);
    expect((document.paths["/api/auth/login"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/auth/login"] as any)?.post?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/auth/login"] as any)?.post?.responses?.["403"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/auth/login"] as any)?.post?.responses?.["400"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/customers"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/customers/{id}"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/leads/{id}/convert"] as any)?.post?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/sales-opportunities/{id}/mark-won"] as any)?.patch?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/sales-opportunities/{id}/mark-lost"] as any)?.patch?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/uploads"] as any)?.post?.requestBody?.content?.["multipart/form-data"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-api/customers"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/customers"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/leads"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/sales-opportunities"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-integration/credentials"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-integration/webhooks"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/batch-tasks/customers/import"] as any)?.post?.requestBody?.content?.["multipart/form-data"]?.examples).toBeTruthy();
    expect((document.paths["/api/batch-tasks/{id}"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/batch-tasks/{id}/failures"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/workflows/tasks/pending"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/workflows/tasks/{taskId}/approve"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/workflows/tasks/{taskId}/approve"] as any)?.post?.responses?.["403"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/workflows/templates/{id}/start"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/workflows/instances/{id}"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/notification-center/notifications"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/notification-center/notifications/{id}/read"] as any)?.post?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/notification-center/preferences"] as any)?.put?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/users"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/users"] as any)?.post?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/users/{id}"] as any)?.patch?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/roles/permissions/catalog"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/roles/{id}"] as any)?.patch?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/departments/{id}"] as any)?.patch?.requestBody?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-integration/webhooks/{id}/deliveries"] as any)?.get?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-integration/webhooks/{id}/test"] as any)?.post?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.paths["/api/open-integration/credentials/{id}/rotate"] as any)?.post?.responses?.["200"]?.content?.["application/json"]?.examples).toBeTruthy();
    expect((document.components?.schemas as any)?.CurrentUserVo?.properties?.dataScopes?.description).toContain("SELF=仅本人");
    expect((document.components?.schemas as any)?.LeadVo?.properties?.status?.description).toContain("NEW=新线索");
    expect((document.components?.schemas as any)?.LeadReminderVo?.properties?.status?.description).toContain("PENDING=待处理");
    expect((document.components?.schemas as any)?.SalesOpportunityVo?.properties?.stage?.description).toContain("DISCOVERY=需求发现");
    expect((document.components?.schemas as any)?.SalesOpportunityVo?.properties?.resultStatus?.description).toContain("IN_PROGRESS=推进中");
    expect((document.components?.schemas as any)?.AttachmentVo?.properties?.businessType?.description).toContain("CUSTOMER=客户附件");
    expect((document.components?.schemas as any)?.UserVo?.properties?.id?.description).toBe("员工 ID。");
    expect((document.components?.schemas as any)?.RoleVo?.properties?.id?.description).toBe("角色 ID。");
    expect((document.components?.schemas as any)?.DepartmentVo?.properties?.id?.description).toBe("部门 ID。");
    expect((document.components?.schemas as any)?.NotificationRecordVo?.properties?.id?.description).toContain("通知记录 ID");
    expect((document.components?.schemas as any)?.OpenApiCredentialVo?.properties?.id?.description).toContain("Open API 凭证 ID");
    expect((document.components?.schemas as any)?.WebhookDeliveryVo?.properties?.id?.description).toContain("Webhook 投递记录 ID");
  });
});
