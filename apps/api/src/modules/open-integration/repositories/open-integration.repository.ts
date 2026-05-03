import { Injectable } from "@nestjs/common";
import { Prisma, type IdentityConnectorMatchField } from "@prisma/client";

import type { PaginationParams } from "@/common/pagination/pagination.util";
import { PrismaService } from "@/common/prisma/prisma.service";

const toOptionalJsonObject = (
  value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonObject;
};

const authUserInclude = Prisma.validator<Prisma.UserInclude>()({
  tenant: true,
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
});

const openApiCredentialSelect = Prisma.validator<Prisma.OpenApiCredentialSelect>()({
  id: true,
  tenantId: true,
  name: true,
  accessKey: true,
  secretHash: true,
  secretHashVersion: true,
  scopes: true,
  status: true,
  expiresAt: true,
  lastUsedAt: true,
  rotatedAt: true,
  revokedAt: true,
  createdByName: true,
  createdAt: true,
  updatedAt: true
});

const webhookSubscriptionSelect = Prisma.validator<Prisma.WebhookSubscriptionSelect>()({
  id: true,
  tenantId: true,
  name: true,
  endpointUrl: true,
  eventTypes: true,
  status: true,
  signingSecret: true,
  signingSecretCiphertext: true,
  signingSecretVersion: true,
  signingSecretHint: true,
  maxAttempts: true,
  timeoutSeconds: true,
  lastTriggeredAt: true,
  lastDeliveryStatus: true,
  lastFailureMessage: true,
  createdByName: true,
  updatedByName: true,
  createdAt: true,
  updatedAt: true
});

const webhookDeliverySelect = Prisma.validator<Prisma.WebhookDeliverySelect>()({
  id: true,
  tenantId: true,
  subscriptionId: true,
  eventType: true,
  sourceType: true,
  sourceId: true,
  payload: true,
  signature: true,
  status: true,
  attemptCount: true,
  responseStatusCode: true,
  responseBody: true,
  errorMessage: true,
  nextRetryAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true
});

const identityConnectorSelect = Prisma.validator<Prisma.IdentityConnectorSelect>()({
  id: true,
  tenantId: true,
  name: true,
  type: true,
  status: true,
  matchField: true,
  issuerUrl: true,
  authorizeUrl: true,
  tokenUrl: true,
  directoryUrl: true,
  clientId: true,
  clientSecretHash: true,
  clientSecretHashVersion: true,
  clientSecretHint: true,
  allowedDomains: true,
  config: true,
  lastAuthenticatedAt: true,
  lastFailureAt: true,
  lastFailureMessage: true,
  createdByName: true,
  updatedByName: true,
  createdAt: true,
  updatedAt: true
});

const connectorBindingSelect = Prisma.validator<Prisma.IdentityConnectorBindingSelect>()({
  id: true,
  connectorId: true,
  userId: true,
  externalSubject: true,
  externalUsername: true,
  externalEmail: true,
  lastAuthenticatedAt: true,
  user: {
    include: authUserInclude
  }
});

const openApiCustomerInclude = Prisma.validator<Prisma.CustomerInclude>()({
  owner: {
    select: {
      id: true,
      displayName: true
    }
  },
  tags: {
    include: {
      tag: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
});

export type OpenApiCredentialRecord = Prisma.OpenApiCredentialGetPayload<{
  select: typeof openApiCredentialSelect;
}>;
export type WebhookSubscriptionRecord = Prisma.WebhookSubscriptionGetPayload<{
  select: typeof webhookSubscriptionSelect;
}>;
export type WebhookDeliveryRecord = Prisma.WebhookDeliveryGetPayload<{
  select: typeof webhookDeliverySelect;
}>;
export type IdentityConnectorRecord = Prisma.IdentityConnectorGetPayload<{
  select: typeof identityConnectorSelect;
}>;
export type ConnectorBindingRecord = Prisma.IdentityConnectorBindingGetPayload<{
  select: typeof connectorBindingSelect;
}>;
export type ConnectorLoginUserRecord = Prisma.UserGetPayload<{
  include: typeof authUserInclude;
}>;
export type OpenApiCustomerRecord = Prisma.CustomerGetPayload<{
  include: typeof openApiCustomerInclude;
}>;

@Injectable()
export class OpenIntegrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  listOpenApiCredentials(tenantId: string): Promise<OpenApiCredentialRecord[]> {
    return this.prisma.openApiCredential.findMany({
      where: {
        tenantId
      },
      select: openApiCredentialSelect,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  findOpenApiCredentialById(id: string, tenantId: string): Promise<OpenApiCredentialRecord> {
    return this.prisma.openApiCredential.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: openApiCredentialSelect
    });
  }

  findOpenApiCredentialByAccessKey(accessKey: string): Promise<OpenApiCredentialRecord | null> {
    return this.prisma.openApiCredential.findFirst({
      where: {
        accessKey
      },
      select: openApiCredentialSelect
    });
  }

  createOpenApiCredential(data: {
    tenantId: string;
    name: string;
    accessKey: string;
    secretHash: string;
    secretHashVersion: string;
    scopes: string[];
    expiresAt?: Date;
    createdByName?: string;
  }): Promise<OpenApiCredentialRecord> {
    return this.prisma.openApiCredential.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        accessKey: data.accessKey,
        secretHash: data.secretHash,
        secretHashVersion: data.secretHashVersion,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
        createdByName: data.createdByName
      },
      select: openApiCredentialSelect
    });
  }

  updateOpenApiCredential(
    id: string,
    tenantId: string,
    data: {
      secretHash?: string;
      secretHashVersion?: string;
      status?: OpenApiCredentialRecord["status"];
      rotatedAt?: Date | null;
      revokedAt?: Date | null;
      lastUsedAt?: Date | null;
    }
  ): Promise<OpenApiCredentialRecord> {
    return this.prisma.openApiCredential
      .updateMany({
        where: {
          id,
          tenantId
        },
        data
      })
      .then(() => this.findOpenApiCredentialById(id, tenantId));
  }

  listWebhookSubscriptions(tenantId: string): Promise<WebhookSubscriptionRecord[]> {
    return this.prisma.webhookSubscription.findMany({
      where: {
        tenantId
      },
      select: webhookSubscriptionSelect,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  findWebhookSubscriptionById(id: string, tenantId: string): Promise<WebhookSubscriptionRecord> {
    return this.prisma.webhookSubscription.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: webhookSubscriptionSelect
    });
  }

  createWebhookSubscription(data: {
    tenantId: string;
    name: string;
    endpointUrl: string;
    eventTypes: string[];
    status: WebhookSubscriptionRecord["status"];
    signingSecret: string;
    signingSecretCiphertext?: string | null;
    signingSecretVersion: string;
    signingSecretHint: string;
    maxAttempts: number;
    timeoutSeconds: number;
    createdByName?: string;
    updatedByName?: string;
  }): Promise<WebhookSubscriptionRecord> {
    return this.prisma.webhookSubscription.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        endpointUrl: data.endpointUrl,
        eventTypes: data.eventTypes,
        status: data.status,
        signingSecret: data.signingSecret,
        signingSecretCiphertext: data.signingSecretCiphertext,
        signingSecretVersion: data.signingSecretVersion,
        signingSecretHint: data.signingSecretHint,
        maxAttempts: data.maxAttempts,
        timeoutSeconds: data.timeoutSeconds,
        createdByName: data.createdByName,
        updatedByName: data.updatedByName
      },
      select: webhookSubscriptionSelect
    });
  }

  updateWebhookSubscription(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      endpointUrl?: string;
      eventTypes?: string[];
      status?: WebhookSubscriptionRecord["status"];
      signingSecret?: string;
      signingSecretCiphertext?: string | null;
      signingSecretVersion?: string;
      signingSecretHint?: string;
      maxAttempts?: number;
      timeoutSeconds?: number;
      lastTriggeredAt?: Date | null;
      lastDeliveryStatus?: WebhookDeliveryRecord["status"] | null;
      lastFailureMessage?: string | null;
      updatedByName?: string;
    }
  ): Promise<WebhookSubscriptionRecord> {
    return this.prisma.webhookSubscription
      .updateMany({
        where: {
          id,
          tenantId
        },
        data
      })
      .then(() => this.findWebhookSubscriptionById(id, tenantId));
  }

  createWebhookDelivery(data: {
    tenantId: string;
    subscriptionId: string;
    eventType: string;
    sourceType: string;
    sourceId: string;
    payload: Record<string, unknown>;
    signature: string;
    status: WebhookDeliveryRecord["status"];
    attemptCount: number;
    responseStatusCode?: number | null;
    responseBody?: string | null;
    errorMessage?: string | null;
    nextRetryAt?: Date | null;
    deliveredAt?: Date | null;
  }): Promise<WebhookDeliveryRecord> {
    return this.prisma.webhookDelivery.create({
      data: {
        tenantId: data.tenantId,
        subscriptionId: data.subscriptionId,
        eventType: data.eventType,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        payload: data.payload as Prisma.InputJsonObject,
        signature: data.signature,
        status: data.status,
        attemptCount: data.attemptCount,
        responseStatusCode: data.responseStatusCode,
        responseBody: data.responseBody,
        errorMessage: data.errorMessage,
        nextRetryAt: data.nextRetryAt,
        deliveredAt: data.deliveredAt
      },
      select: webhookDeliverySelect
    });
  }

  updateWebhookDelivery(
    id: string,
    tenantId: string,
    data: {
      payload?: Record<string, unknown>;
      signature?: string;
      status?: WebhookDeliveryRecord["status"];
      attemptCount?: number;
      responseStatusCode?: number | null;
      responseBody?: string | null;
      errorMessage?: string | null;
      nextRetryAt?: Date | null;
      deliveredAt?: Date | null;
    }
  ): Promise<WebhookDeliveryRecord> {
    return this.prisma.webhookDelivery.update({
      where: {
        id,
        tenantId
      },
      data: {
        payload: data.payload ? (data.payload as Prisma.InputJsonObject) : undefined,
        signature: data.signature,
        status: data.status,
        attemptCount: data.attemptCount,
        responseStatusCode: data.responseStatusCode,
        responseBody: data.responseBody,
        errorMessage: data.errorMessage,
        nextRetryAt: data.nextRetryAt,
        deliveredAt: data.deliveredAt
      },
      select: webhookDeliverySelect
    });
  }

  listWebhookDeliveries(tenantId: string, subscriptionId: string): Promise<WebhookDeliveryRecord[]> {
    return this.prisma.webhookDelivery.findMany({
      where: {
        tenantId,
        subscriptionId
      },
      select: webhookDeliverySelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20
    });
  }

  listIdentityConnectors(tenantId: string): Promise<IdentityConnectorRecord[]> {
    return this.prisma.identityConnector.findMany({
      where: {
        tenantId
      },
      select: identityConnectorSelect,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });
  }

  findIdentityConnectorById(id: string, tenantId?: string): Promise<IdentityConnectorRecord> {
    return this.prisma.identityConnector.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      select: identityConnectorSelect
    });
  }

  createIdentityConnector(data: {
    tenantId: string;
    name: string;
    type: IdentityConnectorRecord["type"];
    status: IdentityConnectorRecord["status"];
    matchField: IdentityConnectorRecord["matchField"];
    issuerUrl?: string | null;
    authorizeUrl?: string | null;
    tokenUrl?: string | null;
    directoryUrl?: string | null;
    clientId?: string | null;
    clientSecretHash?: string | null;
    clientSecretHashVersion?: string | null;
    clientSecretHint?: string | null;
    allowedDomains?: string[];
    config?: Record<string, unknown>;
    createdByName?: string;
    updatedByName?: string;
  }): Promise<IdentityConnectorRecord> {
    return this.prisma.identityConnector.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type,
        status: data.status,
        matchField: data.matchField,
        issuerUrl: data.issuerUrl,
        authorizeUrl: data.authorizeUrl,
        tokenUrl: data.tokenUrl,
        directoryUrl: data.directoryUrl,
        clientId: data.clientId,
        clientSecretHash: data.clientSecretHash,
        clientSecretHashVersion: data.clientSecretHashVersion,
        clientSecretHint: data.clientSecretHint,
        allowedDomains: data.allowedDomains,
        config: toOptionalJsonObject(data.config),
        createdByName: data.createdByName,
        updatedByName: data.updatedByName
      },
      select: identityConnectorSelect
    });
  }

  updateIdentityConnector(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      type?: IdentityConnectorRecord["type"];
      status?: IdentityConnectorRecord["status"];
      matchField?: IdentityConnectorMatchField;
      issuerUrl?: string | null;
      authorizeUrl?: string | null;
      tokenUrl?: string | null;
      directoryUrl?: string | null;
      clientId?: string | null;
      clientSecretHash?: string | null;
      clientSecretHashVersion?: string | null;
      clientSecretHint?: string | null;
      allowedDomains?: string[];
      config?: Record<string, unknown>;
      lastAuthenticatedAt?: Date | null;
      lastFailureAt?: Date | null;
      lastFailureMessage?: string | null;
      updatedByName?: string;
    }
  ): Promise<IdentityConnectorRecord> {
    return this.prisma.identityConnector
      .updateMany({
        where: {
          id,
          tenantId
        },
        data: {
          ...data,
          config: toOptionalJsonObject(data.config)
        }
      })
      .then(() => this.findIdentityConnectorById(id, tenantId));
  }

  findIdentityBindingBySubject(connectorId: string, externalSubject: string): Promise<ConnectorBindingRecord | null> {
    return this.prisma.identityConnectorBinding.findFirst({
      where: {
        connectorId,
        externalSubject
      },
      select: connectorBindingSelect
    });
  }

  upsertIdentityBinding(data: {
    tenantId: string;
    connectorId: string;
    userId: string;
    externalSubject: string;
    externalUsername?: string;
    externalEmail?: string;
  }) {
    return this.prisma.identityConnectorBinding.upsert({
      where: {
        connectorId_externalSubject: {
          connectorId: data.connectorId,
          externalSubject: data.externalSubject
        }
      },
      update: {
        userId: data.userId,
        externalUsername: data.externalUsername,
        externalEmail: data.externalEmail,
        lastAuthenticatedAt: new Date()
      },
      create: {
        tenantId: data.tenantId,
        connectorId: data.connectorId,
        userId: data.userId,
        externalSubject: data.externalSubject,
        externalUsername: data.externalUsername,
        externalEmail: data.externalEmail,
        lastAuthenticatedAt: new Date()
      }
    });
  }

  findConnectorLoginUser(
    tenantId: string,
    matchField: IdentityConnectorMatchField,
    value: string
  ): Promise<ConnectorLoginUserRecord | null> {
    return this.prisma.user.findFirst({
      where: {
        tenantId,
        ...(matchField === "EMAIL" ? { email: value } : { username: value })
      },
      include: authUserInclude
    });
  }

  async listOpenApiCustomers(
    tenantId: string,
    where: Prisma.CustomerWhereInput,
    orderBy: Prisma.CustomerOrderByWithRelationInput[],
    pagination: PaginationParams
  ) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where: {
          AND: [{ tenantId }, where]
        },
        include: openApiCustomerInclude,
        orderBy,
        skip: pagination.skip,
        take: pagination.take
      }),
      this.prisma.customer.count({
        where: {
          AND: [{ tenantId }, where]
        }
      })
    ]);

    return {
      items,
      total
    };
  }

  findOpenApiCustomerById(id: string, tenantId: string): Promise<OpenApiCustomerRecord> {
    return this.prisma.customer.findFirstOrThrow({
      where: {
        id,
        tenantId
      },
      include: openApiCustomerInclude
    });
  }
}
