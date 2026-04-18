import { createHash, createHmac, randomBytes } from "crypto";

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import {
  AuditActionType,
  IdentityConnectorMatchField,
  OpenApiCredentialStatus,
  Prisma,
  RecordStatus,
  WebhookDeliveryStatus,
  WebhookSubscriptionStatus
} from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import {
  buildPaginatedResponse,
  getPaginationParams,
  resolveSort
} from "@/common/pagination/pagination.util";
import { toIsoString } from "@/common/mappers/date-time.mapper";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuthService } from "../auth/auth.service";
import { ConnectorLoginDto } from "./dto/connector-login.dto";
import { CreateIdentityConnectorDto } from "./dto/create-identity-connector.dto";
import { CreateOpenApiCredentialDto } from "./dto/create-open-api-credential.dto";
import { CreateWebhookSubscriptionDto } from "./dto/create-webhook-subscription.dto";
import { ListOpenApiCustomersDto } from "./dto/list-open-api-customers.dto";
import { UpdateIdentityConnectorDto } from "./dto/update-identity-connector.dto";
import { UpdateWebhookSubscriptionDto } from "./dto/update-webhook-subscription.dto";
import {
  OpenIntegrationRepository,
  type IdentityConnectorRecord,
  type OpenApiCredentialRecord,
  type OpenApiCustomerRecord,
  type WebhookDeliveryRecord,
  type WebhookSubscriptionRecord
} from "./repositories/open-integration.repository";

const OPEN_API_SCOPE_OPTIONS = ["customer:read"] as const;
const WEBHOOK_EVENT_OPTIONS = [
  "APPROVAL_COMPLETED",
  "REVENUE_PAYMENT_RECEIVED",
  "WORKFLOW_INSTANCE_COMPLETED",
  "GOVERNANCE_ALERT"
] as const;
const OPEN_API_CUSTOMER_SORT_FIELDS = ["createdAt", "updatedAt", "name"] as const;

@Injectable()
export class OpenIntegrationService {
  constructor(
    private readonly openIntegrationRepository: OpenIntegrationRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly authService: AuthService
  ) {}

  async listOpenApiCredentials(actor: AuthUser) {
    const credentials = await this.openIntegrationRepository.listOpenApiCredentials(requireTenantId(actor));
    return credentials.map((item) => this.mapOpenApiCredential(item));
  }

  async createOpenApiCredential(dto: CreateOpenApiCredentialDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const plainSecret = this.generateSecret("opsk");
    const credential = await this.openIntegrationRepository.createOpenApiCredential({
      tenantId,
      name: dto.name.trim(),
      accessKey: this.generateAccessKey(),
      secretHash: this.hashValue(plainSecret),
      scopes: this.normalizeOpenApiScopes(dto.scopes),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdByName: actor.displayName
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.CREATE, "open-api-credential", credential.id, {
      name: credential.name,
      scopes: this.readStringArray(credential.scopes)
    });

    return this.mapOpenApiCredential(credential, plainSecret);
  }

  async rotateOpenApiCredential(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const current = await this.openIntegrationRepository.findOpenApiCredentialById(id, tenantId);

    if (current.status !== OpenApiCredentialStatus.ACTIVE) {
      throw new BadRequestException("Only active credentials can be rotated.");
    }

    const plainSecret = this.generateSecret("opsk");
    const credential = await this.openIntegrationRepository.updateOpenApiCredential(id, tenantId, {
      secretHash: this.hashValue(plainSecret),
      rotatedAt: new Date()
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.UPDATE, "open-api-credential", credential.id, {
      action: "rotate_secret"
    });

    return this.mapOpenApiCredential(credential, plainSecret);
  }

  async revokeOpenApiCredential(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const credential = await this.openIntegrationRepository.updateOpenApiCredential(id, tenantId, {
      status: OpenApiCredentialStatus.REVOKED,
      revokedAt: new Date()
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.DISABLE, "open-api-credential", credential.id, {
      action: "revoke"
    });

    return this.mapOpenApiCredential(credential);
  }

  async listWebhookSubscriptions(actor: AuthUser) {
    const subscriptions = await this.openIntegrationRepository.listWebhookSubscriptions(requireTenantId(actor));
    return subscriptions.map((item) => this.mapWebhookSubscription(item));
  }

  async createWebhookSubscription(dto: CreateWebhookSubscriptionDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const plainSigningSecret = this.generateSecret("whs");
    const subscription = await this.openIntegrationRepository.createWebhookSubscription({
      tenantId,
      name: dto.name.trim(),
      endpointUrl: dto.endpointUrl.trim(),
      eventTypes: this.normalizeWebhookEventTypes(dto.eventTypes),
      status: dto.status ?? WebhookSubscriptionStatus.ACTIVE,
      signingSecret: plainSigningSecret,
      signingSecretHint: this.buildSecretHint(plainSigningSecret),
      maxAttempts: dto.maxAttempts ?? 3,
      timeoutSeconds: dto.timeoutSeconds ?? 10,
      createdByName: actor.displayName,
      updatedByName: actor.displayName
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.CREATE, "webhook-subscription", subscription.id, {
      endpointUrl: subscription.endpointUrl,
      eventTypes: this.readStringArray(subscription.eventTypes)
    });

    return this.mapWebhookSubscription(subscription, plainSigningSecret);
  }

  async updateWebhookSubscription(id: string, dto: UpdateWebhookSubscriptionDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const current = await this.openIntegrationRepository.findWebhookSubscriptionById(id, tenantId);
    const nextSecret = dto.rotateSecret ? this.generateSecret("whs") : undefined;
    const subscription = await this.openIntegrationRepository.updateWebhookSubscription(id, tenantId, {
      name: dto.name?.trim(),
      endpointUrl: dto.endpointUrl?.trim(),
      eventTypes: dto.eventTypes ? this.normalizeWebhookEventTypes(dto.eventTypes) : undefined,
      status: dto.status,
      signingSecret: nextSecret,
      signingSecretHint: nextSecret ? this.buildSecretHint(nextSecret) : undefined,
      maxAttempts: dto.maxAttempts,
      timeoutSeconds: dto.timeoutSeconds,
      updatedByName: actor.displayName
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.UPDATE, "webhook-subscription", subscription.id, {
      before: {
        endpointUrl: current.endpointUrl,
        eventTypes: this.readStringArray(current.eventTypes)
      },
      after: {
        endpointUrl: subscription.endpointUrl,
        eventTypes: this.readStringArray(subscription.eventTypes),
        rotateSecret: Boolean(nextSecret)
      }
    });

    return this.mapWebhookSubscription(subscription, nextSecret);
  }

  async triggerWebhookTest(id: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const subscription = await this.openIntegrationRepository.findWebhookSubscriptionById(id, tenantId);

    if (subscription.status !== WebhookSubscriptionStatus.ACTIVE) {
      throw new BadRequestException("Webhook subscription is disabled.");
    }

    const payload = {
      eventType: this.readStringArray(subscription.eventTypes)[0] ?? "GOVERNANCE_ALERT",
      sourceType: "system-administration",
      sourceId: id,
      occurredAt: new Date().toISOString(),
      tenantId
    };
    const signature = this.signWebhookPayload(subscription.signingSecret, payload);
    const result = this.simulateWebhookDelivery(subscription.endpointUrl, subscription.maxAttempts);
    const delivery = await this.openIntegrationRepository.createWebhookDelivery({
      tenantId,
      subscriptionId: subscription.id,
      eventType: payload.eventType,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      payload,
      signature,
      status: result.status,
      attemptCount: result.attemptCount,
      responseStatusCode: result.responseStatusCode,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
      nextRetryAt: result.nextRetryAt,
      deliveredAt: result.deliveredAt
    });

    await this.openIntegrationRepository.updateWebhookSubscription(subscription.id, tenantId, {
      lastTriggeredAt: new Date(),
      lastDeliveryStatus: delivery.status,
      lastFailureMessage: delivery.errorMessage ?? null,
      updatedByName: actor.displayName
    });

    await this.createAuditLog(
      tenantId,
      actor,
      delivery.status === WebhookDeliveryStatus.SUCCEEDED
        ? AuditActionType.WEBHOOK_DELIVERY
        : AuditActionType.WEBHOOK_DELIVERY_FAILED,
      "webhook-delivery",
      delivery.id,
      {
        endpointUrl: subscription.endpointUrl,
        eventType: delivery.eventType,
        attemptCount: delivery.attemptCount
      }
    );

    return this.mapWebhookDelivery(delivery);
  }

  async listWebhookDeliveries(subscriptionId: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    await this.openIntegrationRepository.findWebhookSubscriptionById(subscriptionId, tenantId);
    const deliveries = await this.openIntegrationRepository.listWebhookDeliveries(tenantId, subscriptionId);
    return deliveries.map((item) => this.mapWebhookDelivery(item));
  }

  async listIdentityConnectors(actor: AuthUser) {
    const connectors = await this.openIntegrationRepository.listIdentityConnectors(requireTenantId(actor));
    return connectors.map((item) => this.mapIdentityConnector(item));
  }

  async createIdentityConnector(dto: CreateIdentityConnectorDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const connector = await this.openIntegrationRepository.createIdentityConnector({
      tenantId,
      name: dto.name.trim(),
      type: dto.type,
      status: dto.status ?? RecordStatus.ACTIVE,
      matchField: dto.matchField ?? IdentityConnectorMatchField.EMAIL,
      issuerUrl: this.normalizeText(dto.issuerUrl),
      authorizeUrl: this.normalizeText(dto.authorizeUrl),
      tokenUrl: this.normalizeText(dto.tokenUrl),
      directoryUrl: this.normalizeText(dto.directoryUrl),
      clientId: this.normalizeText(dto.clientId),
      clientSecretHash: dto.clientSecret ? this.hashValue(dto.clientSecret) : undefined,
      clientSecretHint: dto.clientSecret ? this.buildSecretHint(dto.clientSecret) : undefined,
      allowedDomains: this.normalizeDomains(dto.allowedDomains),
      config: dto.config,
      createdByName: actor.displayName,
      updatedByName: actor.displayName
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.CREATE, "identity-connector", connector.id, {
      type: connector.type,
      matchField: connector.matchField
    });

    return this.mapIdentityConnector(connector);
  }

  async updateIdentityConnector(id: string, dto: UpdateIdentityConnectorDto, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    const current = await this.openIntegrationRepository.findIdentityConnectorById(id, tenantId);
    const connector = await this.openIntegrationRepository.updateIdentityConnector(id, tenantId, {
      name: dto.name?.trim(),
      type: dto.type,
      status: dto.status,
      matchField: dto.matchField,
      issuerUrl: dto.issuerUrl === undefined ? undefined : this.normalizeText(dto.issuerUrl),
      authorizeUrl: dto.authorizeUrl === undefined ? undefined : this.normalizeText(dto.authorizeUrl),
      tokenUrl: dto.tokenUrl === undefined ? undefined : this.normalizeText(dto.tokenUrl),
      directoryUrl: dto.directoryUrl === undefined ? undefined : this.normalizeText(dto.directoryUrl),
      clientId: dto.clientId === undefined ? undefined : this.normalizeText(dto.clientId),
      clientSecretHash: dto.clientSecret ? this.hashValue(dto.clientSecret) : undefined,
      clientSecretHint: dto.clientSecret ? this.buildSecretHint(dto.clientSecret) : undefined,
      allowedDomains: dto.allowedDomains ? this.normalizeDomains(dto.allowedDomains) : undefined,
      config: dto.config,
      updatedByName: actor.displayName
    });

    await this.createAuditLog(tenantId, actor, AuditActionType.UPDATE, "identity-connector", connector.id, {
      before: {
        type: current.type,
        status: current.status
      },
      after: {
        type: connector.type,
        status: connector.status
      }
    });

    return this.mapIdentityConnector(connector);
  }

  async loginWithIdentityConnector(connectorId: string, dto: ConnectorLoginDto) {
    const connector = await this.openIntegrationRepository.findIdentityConnectorById(connectorId);
    const tenantId = connector.tenantId;

    if (connector.status !== RecordStatus.ACTIVE) {
      await this.auditLogsService.create({
        tenantId,
        actorName: dto.displayName ?? dto.email ?? dto.username ?? dto.subject ?? connector.name,
        actionType: AuditActionType.SIGN_IN_FAILED,
        targetType: "identity-connector",
        targetId: connector.id,
        detail: {
          reason: "connector_disabled"
        }
      });
      throw new UnauthorizedException("Identity connector is disabled.");
    }

    const normalizedEmail = this.normalizeText(dto.email)?.toLowerCase();

    try {
      this.assertEmailDomainAllowed(connector, normalizedEmail);
    } catch (error) {
      await this.handleConnectorLoginFailure(connector, dto, "domain_not_allowed");
      throw error;
    }

    const binding = dto.subject
      ? await this.openIntegrationRepository.findIdentityBindingBySubject(connector.id, dto.subject.trim())
      : null;
    const user =
      binding?.user ??
      (normalizedEmail || dto.username
        ? await this.openIntegrationRepository.findConnectorLoginUser(
            tenantId,
            connector.matchField,
            connector.matchField === IdentityConnectorMatchField.EMAIL
              ? normalizedEmail ?? ""
              : dto.username?.trim() ?? ""
          )
        : null);

    if (!user) {
      await this.handleConnectorLoginFailure(connector, dto, "user_not_found");
      throw new UnauthorizedException("The identity cannot be mapped to a tenant user.");
    }

    if (dto.subject?.trim()) {
      await this.openIntegrationRepository.upsertIdentityBinding({
        tenantId,
        connectorId: connector.id,
        userId: user.id,
        externalSubject: dto.subject.trim(),
        externalUsername: this.normalizeText(dto.username) ?? undefined,
        externalEmail: normalizedEmail ?? undefined
      });
    }

    await this.openIntegrationRepository.updateIdentityConnector(connector.id, tenantId, {
      lastAuthenticatedAt: new Date(),
      lastFailureAt: null,
      lastFailureMessage: null
    });

    return this.authService.loginWithUser(user, {
      targetType: "identity-connector",
      targetId: connector.id,
      detail: {
        connectorType: connector.type,
        subject: this.normalizeText(dto.subject),
        email: normalizedEmail ?? null,
        username: this.normalizeText(dto.username)
      }
    });
  }

  async listOpenApiCustomers(query: ListOpenApiCustomersDto, accessKey?: string, secret?: string) {
    const credential = await this.authorizeOpenApiRequest(accessKey, secret, "customer:read", "customers:list");
    const pagination = getPaginationParams(query);
    const sort = resolveSort(query, OPEN_API_CUSTOMER_SORT_FIELDS, {
      field: "updatedAt",
      order: "desc"
    });
    const where: Prisma.CustomerWhereInput = query.keyword
      ? {
          OR: [
            {
              name: {
                contains: query.keyword,
                mode: "insensitive"
              }
            },
            {
              contactName: {
                contains: query.keyword,
                mode: "insensitive"
              }
            },
            {
              email: {
                contains: query.keyword,
                mode: "insensitive"
              }
            },
            {
              phone: {
                contains: query.keyword,
                mode: "insensitive"
              }
            }
          ]
        }
      : {};
    const orderBy: Prisma.CustomerOrderByWithRelationInput[] = [
      { [sort.field]: sort.order } as Prisma.CustomerOrderByWithRelationInput,
      { id: "desc" }
    ];
    const { items, total } = await this.openIntegrationRepository.listOpenApiCustomers(
      credential.tenantId,
      where,
      orderBy,
      pagination
    );

    return buildPaginatedResponse(
      items.map((item) => this.mapOpenApiCustomer(item)),
      total,
      pagination,
      sort
    );
  }

  async getOpenApiCustomerDetail(id: string, accessKey?: string, secret?: string) {
    const credential = await this.authorizeOpenApiRequest(accessKey, secret, "customer:read", `customers:${id}`);
    const customer = await this.openIntegrationRepository.findOpenApiCustomerById(id, credential.tenantId);
    return this.mapOpenApiCustomer(customer);
  }

  private async authorizeOpenApiRequest(
    accessKey: string | undefined,
    secret: string | undefined,
    requiredScope: string,
    resource: string
  ) {
    if (!accessKey || !secret) {
      throw new UnauthorizedException("Missing open API credentials.");
    }

    const credential = await this.openIntegrationRepository.findOpenApiCredentialByAccessKey(accessKey.trim());
    const secretHash = this.hashValue(secret.trim());

    if (!credential || credential.secretHash !== secretHash) {
      await this.auditLogsService.create({
        actorName: accessKey,
        actionType: AuditActionType.ACCESS_DENIED,
        targetType: "open-api-credential",
        detail: {
          reason: "invalid_secret",
          resource
        }
      });
      throw new UnauthorizedException("Open API credential is invalid.");
    }

    if (
      credential.status !== OpenApiCredentialStatus.ACTIVE ||
      credential.revokedAt ||
      (credential.expiresAt && credential.expiresAt <= new Date())
    ) {
      await this.auditLogsService.create({
        tenantId: credential.tenantId,
        actorName: credential.name,
        actionType: AuditActionType.ACCESS_DENIED,
        targetType: "open-api-credential",
        targetId: credential.id,
        detail: {
          reason: credential.revokedAt ? "revoked" : "expired_or_disabled",
          resource
        }
      });
      throw new UnauthorizedException("Open API credential is unavailable.");
    }

    const scopes = this.readStringArray(credential.scopes);

    if (!scopes.includes(requiredScope)) {
      await this.auditLogsService.create({
        tenantId: credential.tenantId,
        actorName: credential.name,
        actionType: AuditActionType.ACCESS_DENIED,
        targetType: "open-api-credential",
        targetId: credential.id,
        detail: {
          reason: "out_of_scope",
          requiredScope,
          resource,
          scopes
        }
      });
      throw new ForbiddenException("Open API credential scope is insufficient.");
    }

    await this.openIntegrationRepository.updateOpenApiCredential(credential.id, credential.tenantId, {
      lastUsedAt: new Date()
    });
    await this.auditLogsService.create({
      tenantId: credential.tenantId,
      actorName: credential.name,
      actionType: AuditActionType.ACCESS,
      targetType: "open-api-credential",
      targetId: credential.id,
      detail: {
        requiredScope,
        resource
      }
    });

    return credential;
  }

  private async handleConnectorLoginFailure(
    connector: IdentityConnectorRecord,
    dto: ConnectorLoginDto,
    reason: string
  ) {
    const now = new Date();
    await this.openIntegrationRepository.updateIdentityConnector(connector.id, connector.tenantId, {
      lastFailureAt: now,
      lastFailureMessage: reason
    });
    await this.auditLogsService.create({
      tenantId: connector.tenantId,
      actorName: dto.displayName ?? dto.email ?? dto.username ?? dto.subject ?? connector.name,
      actionType: AuditActionType.SIGN_IN_FAILED,
      targetType: "identity-connector",
      targetId: connector.id,
      detail: {
        reason
      }
    });
  }

  private assertEmailDomainAllowed(connector: IdentityConnectorRecord, email?: string | null) {
    const allowedDomains = this.readStringArray(connector.allowedDomains).map((item) => item.toLowerCase());

    if (!allowedDomains.length || !email) {
      return;
    }

    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain || !allowedDomains.includes(domain)) {
      throw new ForbiddenException("The email domain is not allowed for this connector.");
    }
  }

  private normalizeOpenApiScopes(scopes: string[]) {
    const normalized = Array.from(
      new Set(
        scopes
          .map((item) => item.trim())
          .filter((item): item is (typeof OPEN_API_SCOPE_OPTIONS)[number] =>
            (OPEN_API_SCOPE_OPTIONS as readonly string[]).includes(item)
          )
      )
    );

    if (!normalized.length) {
      throw new BadRequestException("At least one valid open API scope is required.");
    }

    return normalized;
  }

  private normalizeWebhookEventTypes(eventTypes: string[]) {
    const normalized = Array.from(
      new Set(
        eventTypes
          .map((item) => item.trim())
          .filter((item): item is (typeof WEBHOOK_EVENT_OPTIONS)[number] =>
            (WEBHOOK_EVENT_OPTIONS as readonly string[]).includes(item)
          )
      )
    );

    if (!normalized.length) {
      throw new BadRequestException("At least one valid webhook event type is required.");
    }

    return normalized;
  }

  private normalizeDomains(domains?: string[]) {
    return Array.from(
      new Set(
        (domains ?? [])
          .map((item) => item.trim().toLowerCase())
          .filter((item) => item.length > 0)
      )
    );
  }

  private normalizeText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private generateAccessKey() {
    return `oak_${randomBytes(12).toString("hex")}`;
  }

  private generateSecret(prefix: string) {
    return `${prefix}_${randomBytes(24).toString("hex")}`;
  }

  private hashValue(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private buildSecretHint(secret: string) {
    return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
  }

  private signWebhookPayload(secret: string, payload: Record<string, unknown>) {
    return `sha256=${createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")}`;
  }

  private simulateWebhookDelivery(endpointUrl: string, maxAttempts: number) {
    if (!/^https?:\/\//.test(endpointUrl)) {
      return {
        status: WebhookDeliveryStatus.FAILED,
        attemptCount: 1,
        responseStatusCode: 400,
        responseBody: "invalid_endpoint",
        errorMessage: "回调地址必须以 http:// 或 https:// 开头。",
        nextRetryAt: null,
        deliveredAt: null
      };
    }

    const failForever = endpointUrl.includes("fail");
    const retryOnce = endpointUrl.includes("retry-once");
    let attemptCount = 0;

    while (attemptCount < maxAttempts) {
      attemptCount += 1;

      if (failForever) {
        continue;
      }

      if (retryOnce && attemptCount < 2) {
        continue;
      }

      return {
        status: WebhookDeliveryStatus.SUCCEEDED,
        attemptCount,
        responseStatusCode: 200,
        responseBody: "accepted",
        errorMessage: null,
        nextRetryAt: null,
        deliveredAt: new Date()
      };
    }

    return {
      status: WebhookDeliveryStatus.FAILED,
      attemptCount,
      responseStatusCode: 502,
      responseBody: "upstream_failed",
      errorMessage: `模拟回调连续失败，已执行 ${attemptCount} 次重试。`,
      nextRetryAt: null,
      deliveredAt: null
    };
  }

  private readStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private mapOpenApiCredential(record: OpenApiCredentialRecord, plainSecret?: string) {
    return {
      id: record.id,
      name: record.name,
      accessKey: record.accessKey,
      scopes: this.readStringArray(record.scopes),
      status: record.status,
      expiresAt: toIsoString(record.expiresAt) ?? null,
      lastUsedAt: toIsoString(record.lastUsedAt) ?? null,
      rotatedAt: toIsoString(record.rotatedAt) ?? null,
      revokedAt: toIsoString(record.revokedAt) ?? null,
      createdByName: record.createdByName ?? null,
      plainSecret: plainSecret ?? null,
      createdAt: toIsoString(record.createdAt)!,
      updatedAt: toIsoString(record.updatedAt)!
    };
  }

  private mapWebhookSubscription(record: WebhookSubscriptionRecord, plainSigningSecret?: string) {
    return {
      id: record.id,
      name: record.name,
      endpointUrl: record.endpointUrl,
      eventTypes: this.readStringArray(record.eventTypes),
      status: record.status,
      signingSecretHint: record.signingSecretHint,
      maxAttempts: record.maxAttempts,
      timeoutSeconds: record.timeoutSeconds,
      lastTriggeredAt: toIsoString(record.lastTriggeredAt) ?? null,
      lastDeliveryStatus: record.lastDeliveryStatus ?? null,
      lastFailureMessage: record.lastFailureMessage ?? null,
      createdByName: record.createdByName ?? null,
      updatedByName: record.updatedByName ?? null,
      plainSigningSecret: plainSigningSecret ?? null,
      createdAt: toIsoString(record.createdAt)!,
      updatedAt: toIsoString(record.updatedAt)!
    };
  }

  private mapWebhookDelivery(record: WebhookDeliveryRecord) {
    return {
      id: record.id,
      eventType: record.eventType,
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      status: record.status,
      attemptCount: record.attemptCount,
      signature: record.signature,
      responseStatusCode: record.responseStatusCode ?? null,
      responseBody: record.responseBody ?? null,
      errorMessage: record.errorMessage ?? null,
      nextRetryAt: toIsoString(record.nextRetryAt) ?? null,
      deliveredAt: toIsoString(record.deliveredAt) ?? null,
      createdAt: toIsoString(record.createdAt)!
    };
  }

  private mapIdentityConnector(record: IdentityConnectorRecord) {
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      status: record.status,
      matchField: record.matchField,
      issuerUrl: record.issuerUrl ?? null,
      authorizeUrl: record.authorizeUrl ?? null,
      tokenUrl: record.tokenUrl ?? null,
      directoryUrl: record.directoryUrl ?? null,
      clientId: record.clientId ?? null,
      clientSecretHint: record.clientSecretHint ?? null,
      allowedDomains: this.readStringArray(record.allowedDomains),
      config:
        record.config && typeof record.config === "object" && !Array.isArray(record.config)
          ? (record.config as Record<string, unknown>)
          : null,
      lastAuthenticatedAt: toIsoString(record.lastAuthenticatedAt) ?? null,
      lastFailureAt: toIsoString(record.lastFailureAt) ?? null,
      lastFailureMessage: record.lastFailureMessage ?? null,
      createdByName: record.createdByName ?? null,
      updatedByName: record.updatedByName ?? null,
      createdAt: toIsoString(record.createdAt)!,
      updatedAt: toIsoString(record.updatedAt)!
    };
  }

  private mapOpenApiCustomer(record: OpenApiCustomerRecord) {
    return {
      id: record.id,
      name: record.name,
      contactName: record.contactName ?? null,
      phone: record.phone ?? null,
      email: record.email ?? null,
      source: record.source ?? null,
      status: record.status ?? null,
      owner: {
        id: record.owner.id,
        displayName: record.owner.displayName
      },
      tags: record.tags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name
      })),
      createdAt: toIsoString(record.createdAt)!,
      updatedAt: toIsoString(record.updatedAt)!
    };
  }

  private async createAuditLog(
    tenantId: string,
    actor: AuthUser,
    actionType: AuditActionType,
    targetType: string,
    targetId: string,
    detail: Record<string, unknown>
  ) {
    await this.auditLogsService.create({
      tenantId,
      actorId: actor.id,
      actorName: actor.displayName,
      actionType,
      targetType,
      targetId,
      detail: detail as Prisma.InputJsonObject
    });
  }
}
