import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { lookup } from "dns/promises";
import { isIP } from "net";

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
import { JobQueueService, type BackgroundJobHandler } from "@/common/job-queue/job-queue.service";
import { isLocalRuntime } from "@/common/security/security-config.util";
import { RiskThrottleService } from "@/common/security/risk-throttle.service";
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
const OPEN_API_THROTTLE = {
  maxAttempts: 10,
  windowMs: 1000 * 60 * 10,
  lockMs: 1000 * 60 * 15
};
const CONNECTOR_LOGIN_THROTTLE = {
  maxAttempts: 8,
  windowMs: 1000 * 60 * 10,
  lockMs: 1000 * 60 * 15
};
const WEBHOOK_RESPONSE_BODY_LIMIT = 2048;
const WEBHOOK_TEST_MODE_OPTIONS = ["REAL", "SIMULATION"] as const;
const SECRET_HASH_VERSION_SHA256 = "sha256";
const SECRET_HASH_VERSION_HMAC_SHA256_V1 = "hmac-sha256-v1";
const SECRET_CIPHER_VERSION_PLAIN = "plain";
const SECRET_CIPHER_VERSION_AES_256_GCM_V1 = "aes-256-gcm-v1";
const SECRET_ENCRYPTION_KEY_BYTES = 32;
const SECRET_ENCRYPTION_IV_BYTES = 12;
const WEBHOOK_TEST_JOB_TYPE = "open-integration.webhook-test";
const WEBHOOK_EVENT_DELIVERY_JOB_TYPE = "open-integration.webhook-event-delivery";

type WebhookTestMode = (typeof WEBHOOK_TEST_MODE_OPTIONS)[number];
type WebhookEventType = (typeof WEBHOOK_EVENT_OPTIONS)[number];

interface WebhookDeliveryResult {
  status: WebhookDeliveryStatus;
  attemptCount: number;
  responseStatusCode: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  nextRetryAt: Date | null;
  deliveredAt: Date | null;
  deliveryMode: WebhookTestMode;
  durationMs: number | null;
}

@Injectable()
export class OpenIntegrationService implements OnModuleInit {
  constructor(
    private readonly openIntegrationRepository: OpenIntegrationRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly authService: AuthService,
    private readonly configService?: ConfigService,
    private readonly riskThrottleService?: RiskThrottleService,
    private readonly jobQueueService?: JobQueueService
  ) {}

  onModuleInit(): void {
    this.jobQueueService?.registerHandler(WEBHOOK_TEST_JOB_TYPE, this.handleWebhookTestJob as BackgroundJobHandler);
    this.jobQueueService?.registerHandler(
      WEBHOOK_EVENT_DELIVERY_JOB_TYPE,
      this.handleWebhookEventDeliveryJob as BackgroundJobHandler
    );
  }

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
      secretHash: this.hashSecret(plainSecret).hash,
      secretHashVersion: SECRET_HASH_VERSION_HMAC_SHA256_V1,
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
    const hashedSecret = this.hashSecret(plainSecret);
    const credential = await this.openIntegrationRepository.updateOpenApiCredential(id, tenantId, {
      secretHash: hashedSecret.hash,
      secretHashVersion: hashedSecret.version,
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
    const encryptedSigningSecret = this.encryptSecret(plainSigningSecret);
    const subscription = await this.openIntegrationRepository.createWebhookSubscription({
      tenantId,
      name: dto.name.trim(),
      endpointUrl: dto.endpointUrl.trim(),
      eventTypes: this.normalizeWebhookEventTypes(dto.eventTypes),
      status: dto.status ?? WebhookSubscriptionStatus.ACTIVE,
      signingSecret: encryptedSigningSecret.ciphertext,
      signingSecretCiphertext: encryptedSigningSecret.ciphertext,
      signingSecretVersion: encryptedSigningSecret.version,
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
    const encryptedNextSecret = nextSecret ? this.encryptSecret(nextSecret) : undefined;
    const subscription = await this.openIntegrationRepository.updateWebhookSubscription(id, tenantId, {
      name: dto.name?.trim(),
      endpointUrl: dto.endpointUrl?.trim(),
      eventTypes: dto.eventTypes ? this.normalizeWebhookEventTypes(dto.eventTypes) : undefined,
      status: dto.status,
      signingSecret: encryptedNextSecret?.ciphertext,
      signingSecretCiphertext: encryptedNextSecret?.ciphertext,
      signingSecretVersion: encryptedNextSecret?.version,
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
    const signature = this.signWebhookPayload(this.resolveWebhookSigningSecret(subscription), payload);
    const delivery = await this.openIntegrationRepository.createWebhookDelivery({
      tenantId,
      subscriptionId: subscription.id,
      eventType: payload.eventType,
      sourceType: payload.sourceType,
      sourceId: payload.sourceId,
      payload: {
        ...payload,
        queued: true
      },
      signature,
      status: WebhookDeliveryStatus.PENDING,
      attemptCount: 0,
      responseStatusCode: null,
      responseBody: null,
      errorMessage: null,
      nextRetryAt: null,
      deliveredAt: null
    });

    await this.openIntegrationRepository.updateWebhookSubscription(subscription.id, tenantId, {
      lastTriggeredAt: new Date(),
      lastDeliveryStatus: delivery.status,
      lastFailureMessage: null,
      updatedByName: actor.displayName
    });

    if (!this.jobQueueService) {
      const completedDelivery = await this.executeWebhookTestDeliveryJob({
        tenantId,
        subscriptionId: subscription.id,
        deliveryId: delivery.id,
        actorId: actor.id,
        actorName: actor.displayName
      });

      return this.mapWebhookDelivery(completedDelivery);
    }

    await this.jobQueueService.enqueue({
      type: WEBHOOK_TEST_JOB_TYPE,
      payload: {
        tenantId,
        subscriptionId: subscription.id,
        deliveryId: delivery.id,
        actorId: actor.id,
        actorName: actor.displayName
      },
      correlationId: delivery.id
    });
    this.jobQueueService.scheduleRun([WEBHOOK_TEST_JOB_TYPE]);

    return this.mapWebhookDelivery(delivery);
  }

  private handleWebhookTestJob = async (job: Parameters<BackgroundJobHandler>[0]) => {
    const payload = this.readJobPayload(job.payload);
    const delivery = await this.executeWebhookTestDeliveryJob({
      tenantId: this.readRequiredPayloadString(payload, "tenantId"),
      subscriptionId: this.readRequiredPayloadString(payload, "subscriptionId"),
      deliveryId: this.readRequiredPayloadString(payload, "deliveryId"),
      actorId: this.readOptionalPayloadString(payload, "actorId"),
      actorName: this.readOptionalPayloadString(payload, "actorName")
    });

    return {
      deliveryId: delivery.id,
      status: delivery.status
    };
  };

  private handleWebhookEventDeliveryJob = async (job: Parameters<BackgroundJobHandler>[0]) => {
    const payload = this.readJobPayload(job.payload);
    const delivery = await this.executeWebhookEventDeliveryJob({
      tenantId: this.readRequiredPayloadString(payload, "tenantId"),
      subscriptionId: this.readRequiredPayloadString(payload, "subscriptionId"),
      deliveryId: this.readRequiredPayloadString(payload, "deliveryId"),
      actorId: this.readOptionalPayloadString(payload, "actorId"),
      actorName: this.readOptionalPayloadString(payload, "actorName")
    });

    return {
      deliveryId: delivery.id,
      status: delivery.status
    };
  };

  private async executeWebhookTestDeliveryJob(input: {
    tenantId: string;
    subscriptionId: string;
    deliveryId: string;
    actorId?: string;
    actorName?: string;
  }): Promise<WebhookDeliveryRecord> {
    const subscription = await this.openIntegrationRepository.findWebhookSubscriptionById(input.subscriptionId, input.tenantId);
    const eventPayload = {
      eventType: this.readStringArray(subscription.eventTypes)[0] ?? "GOVERNANCE_ALERT",
      sourceType: "system-administration",
      sourceId: input.subscriptionId,
      occurredAt: new Date().toISOString(),
      tenantId: input.tenantId
    };
    const signature = this.signWebhookPayload(this.resolveWebhookSigningSecret(subscription), eventPayload);
    const result = await this.runWebhookTestDelivery(subscription, eventPayload, signature);
    const delivery = await this.openIntegrationRepository.updateWebhookDelivery(input.deliveryId, input.tenantId, {
      payload: {
        ...eventPayload,
        deliveryMode: result.deliveryMode,
        durationMs: result.durationMs
      },
      signature,
      status: result.status,
      attemptCount: result.attemptCount,
      responseStatusCode: result.responseStatusCode,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
      nextRetryAt: result.nextRetryAt,
      deliveredAt: result.deliveredAt
    });

    await this.openIntegrationRepository.updateWebhookSubscription(subscription.id, input.tenantId, {
      lastDeliveryStatus: delivery.status,
      lastFailureMessage: delivery.errorMessage ?? null,
      updatedByName: input.actorName ?? undefined
    });

    await this.createAuditLog(
      input.tenantId,
      {
        id: input.actorId ?? "system",
        displayName: input.actorName ?? "system",
        username: input.actorName ?? "system",
        roleCodes: [],
        permissions: []
      } as AuthUser,
      delivery.status === WebhookDeliveryStatus.SUCCEEDED
        ? AuditActionType.WEBHOOK_DELIVERY
        : AuditActionType.WEBHOOK_DELIVERY_FAILED,
      "webhook-delivery",
      delivery.id,
      {
        endpointUrl: subscription.endpointUrl,
        eventType: delivery.eventType,
        attemptCount: delivery.attemptCount,
        deliveryMode: result.deliveryMode,
        durationMs: result.durationMs
      }
    );

    return delivery;
  }

  private async executeWebhookEventDeliveryJob(input: {
    tenantId: string;
    subscriptionId: string;
    deliveryId: string;
    actorId?: string;
    actorName?: string;
  }): Promise<WebhookDeliveryRecord> {
    const subscription = await this.openIntegrationRepository.findWebhookSubscriptionById(input.subscriptionId, input.tenantId);
    const existingDelivery = (await this.openIntegrationRepository.listWebhookDeliveries(input.tenantId, input.subscriptionId)).find(
      (item) => item.id === input.deliveryId
    );

    if (!existingDelivery) {
      throw new BadRequestException("Webhook delivery was not found.");
    }

    const payloadMetadata =
      existingDelivery.payload && typeof existingDelivery.payload === "object" && !Array.isArray(existingDelivery.payload)
        ? (existingDelivery.payload as Record<string, unknown>)
        : {};
    const signature = this.signWebhookPayload(this.resolveWebhookSigningSecret(subscription), payloadMetadata);
    const result = await this.runWebhookTestDelivery(subscription, payloadMetadata, signature);
    const delivery = await this.openIntegrationRepository.updateWebhookDelivery(input.deliveryId, input.tenantId, {
      payload: {
        ...payloadMetadata,
        deliveryMode: result.deliveryMode,
        durationMs: result.durationMs
      },
      signature,
      status: result.status,
      attemptCount: result.attemptCount,
      responseStatusCode: result.responseStatusCode,
      responseBody: result.responseBody,
      errorMessage: result.errorMessage,
      nextRetryAt: result.nextRetryAt,
      deliveredAt: result.deliveredAt
    });

    await this.openIntegrationRepository.updateWebhookSubscription(subscription.id, input.tenantId, {
      lastDeliveryStatus: delivery.status,
      lastFailureMessage: delivery.errorMessage ?? null,
      updatedByName: input.actorName ?? undefined
    });

    await this.createAuditLog(
      input.tenantId,
      {
        id: input.actorId ?? "system",
        displayName: input.actorName ?? "system",
        username: input.actorName ?? "system",
        roleCodes: [],
        permissions: []
      } as AuthUser,
      delivery.status === WebhookDeliveryStatus.SUCCEEDED
        ? AuditActionType.WEBHOOK_DELIVERY
        : AuditActionType.WEBHOOK_DELIVERY_FAILED,
      "webhook-delivery",
      delivery.id,
      {
        endpointUrl: subscription.endpointUrl,
        eventType: delivery.eventType,
        attemptCount: delivery.attemptCount,
        deliveryMode: result.deliveryMode,
        durationMs: result.durationMs,
        sourceType: delivery.sourceType,
        sourceId: delivery.sourceId
      }
    );

    return delivery;
  }

  async listWebhookDeliveries(subscriptionId: string, actor: AuthUser) {
    const tenantId = requireTenantId(actor);
    await this.openIntegrationRepository.findWebhookSubscriptionById(subscriptionId, tenantId);
    const deliveries = await this.openIntegrationRepository.listWebhookDeliveries(tenantId, subscriptionId);
    return deliveries.map((item) => this.mapWebhookDelivery(item));
  }

  async dispatchBusinessWebhookEvent(input: {
    tenantId: string;
    eventType: WebhookEventType;
    sourceType: string;
    sourceId: string;
    payload: Record<string, unknown>;
    actorId?: string | null;
    actorName?: string | null;
    occurredAt?: Date;
  }) {
    const subscriptions = (await this.openIntegrationRepository.listWebhookSubscriptions(input.tenantId)).filter(
      (subscription) =>
        subscription.status === WebhookSubscriptionStatus.ACTIVE &&
        this.readStringArray(subscription.eventTypes).includes(input.eventType)
    );

    for (const subscription of subscriptions) {
      const eventPayload = {
        eventType: input.eventType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        occurredAt: (input.occurredAt ?? new Date()).toISOString(),
        tenantId: input.tenantId,
        payload: input.payload
      };
      const signature = this.signWebhookPayload(this.resolveWebhookSigningSecret(subscription), eventPayload);
      const delivery = await this.openIntegrationRepository.createWebhookDelivery({
        tenantId: input.tenantId,
        subscriptionId: subscription.id,
        eventType: input.eventType,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        payload: {
          ...eventPayload,
          queued: true
        },
        signature,
        status: WebhookDeliveryStatus.PENDING,
        attemptCount: 0,
        responseStatusCode: null,
        responseBody: null,
        errorMessage: null,
        nextRetryAt: null,
        deliveredAt: null
      });

      await this.openIntegrationRepository.updateWebhookSubscription(subscription.id, input.tenantId, {
        lastTriggeredAt: new Date(),
        lastDeliveryStatus: delivery.status,
        lastFailureMessage: null,
        updatedByName: input.actorName ?? undefined
      });

      if (!this.jobQueueService) {
        await this.executeWebhookEventDeliveryJob({
          tenantId: input.tenantId,
          subscriptionId: subscription.id,
          deliveryId: delivery.id,
          actorId: input.actorId ?? undefined,
          actorName: input.actorName ?? undefined
        });
        continue;
      }

      await this.jobQueueService.enqueue({
        type: WEBHOOK_EVENT_DELIVERY_JOB_TYPE,
        payload: {
          tenantId: input.tenantId,
          subscriptionId: subscription.id,
          deliveryId: delivery.id,
          actorId: input.actorId ?? null,
          actorName: input.actorName ?? null
        },
        correlationId: delivery.id
      });
    }

    this.jobQueueService?.scheduleRun([WEBHOOK_EVENT_DELIVERY_JOB_TYPE]);
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
      clientSecretHash: dto.clientSecret ? this.hashSecret(dto.clientSecret).hash : undefined,
      clientSecretHashVersion: dto.clientSecret ? SECRET_HASH_VERSION_HMAC_SHA256_V1 : undefined,
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
      clientSecretHash: dto.clientSecret ? this.hashSecret(dto.clientSecret).hash : undefined,
      clientSecretHashVersion: dto.clientSecret ? SECRET_HASH_VERSION_HMAC_SHA256_V1 : undefined,
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
    const throttleKey = this.buildThrottleKey("connector-login", connectorId, dto.email ?? dto.username ?? dto.subject ?? "anonymous");
    await this.riskThrottleService?.assertAllowed(throttleKey, CONNECTOR_LOGIN_THROTTLE);
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
      await this.riskThrottleService?.recordFailure(throttleKey, CONNECTOR_LOGIN_THROTTLE);
      throw new UnauthorizedException("Identity connector is disabled.");
    }

    try {
      this.assertConnectorLoginProof(connector, dto);
    } catch (error) {
      await this.handleConnectorLoginFailure(connector, dto, "invalid_login_proof");
      await this.riskThrottleService?.recordFailure(throttleKey, CONNECTOR_LOGIN_THROTTLE);
      throw error;
    }

    const normalizedEmail = this.normalizeText(dto.email)?.toLowerCase();

    try {
      this.assertEmailDomainAllowed(connector, normalizedEmail);
    } catch (error) {
      await this.handleConnectorLoginFailure(connector, dto, "domain_not_allowed");
      await this.riskThrottleService?.recordFailure(throttleKey, CONNECTOR_LOGIN_THROTTLE);
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
      await this.riskThrottleService?.recordFailure(throttleKey, CONNECTOR_LOGIN_THROTTLE);
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

    const upgradedConnectorSecret =
      dto.proofType === "CLIENT_SECRET" && dto.proofSecret && this.needsSecretHashUpgrade(connector.clientSecretHashVersion)
        ? this.hashSecret(dto.proofSecret.trim())
        : undefined;
    await this.openIntegrationRepository.updateIdentityConnector(connector.id, tenantId, {
      clientSecretHash: upgradedConnectorSecret?.hash,
      clientSecretHashVersion: upgradedConnectorSecret?.version,
      lastAuthenticatedAt: new Date(),
      lastFailureAt: null,
      lastFailureMessage: null
    });

    const result = await this.authService.loginWithUser(user, {
      targetType: "identity-connector",
      targetId: connector.id,
      detail: {
        connectorType: connector.type,
        subject: this.normalizeText(dto.subject),
        email: normalizedEmail ?? null,
        username: this.normalizeText(dto.username)
      }
    });
    await this.riskThrottleService?.recordSuccess(throttleKey);

    return result;
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

    const normalizedAccessKey = accessKey.trim();
    const throttleKey = this.buildThrottleKey("open-api", normalizedAccessKey);
    await this.riskThrottleService?.assertAllowed(throttleKey, OPEN_API_THROTTLE);
    const credential = await this.openIntegrationRepository.findOpenApiCredentialByAccessKey(normalizedAccessKey);

    if (!credential || !this.verifyStoredSecret(secret.trim(), credential.secretHash, credential.secretHashVersion)) {
      await this.riskThrottleService?.recordFailure(throttleKey, OPEN_API_THROTTLE);
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
      await this.riskThrottleService?.recordFailure(throttleKey, OPEN_API_THROTTLE);
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

    await this.riskThrottleService?.recordSuccess(throttleKey);
    const upgradedOpenApiSecret = this.needsSecretHashUpgrade(credential.secretHashVersion)
      ? this.hashSecret(secret.trim())
      : undefined;
    await this.openIntegrationRepository.updateOpenApiCredential(credential.id, credential.tenantId, {
      lastUsedAt: new Date(),
      secretHash: upgradedOpenApiSecret?.hash,
      secretHashVersion: upgradedOpenApiSecret?.version
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

  private assertConnectorLoginProof(connector: IdentityConnectorRecord, dto: ConnectorLoginDto): void {
    if (dto.proofType === "MOCK") {
      if (this.isMockConnectorLoginAllowed()) {
        return;
      }

      throw new UnauthorizedException("Mock connector login is disabled.");
    }

    if (dto.proofType !== "CLIENT_SECRET" || !dto.proofSecret) {
      throw new UnauthorizedException("Connector login proof is required.");
    }

    if (
      !connector.clientSecretHash ||
      !this.verifyStoredSecret(dto.proofSecret.trim(), connector.clientSecretHash, connector.clientSecretHashVersion)
    ) {
      throw new UnauthorizedException("Connector login proof is invalid.");
    }
  }

  private isMockConnectorLoginAllowed(): boolean {
    if (!this.configService || !isLocalRuntime(this.configService)) {
      return false;
    }

    return this.configService.get<string>("ALLOW_MOCK_CONNECTOR_LOGIN")?.trim().toLowerCase() === "true";
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

  private hashSecret(value: string) {
    return {
      hash: createHmac("sha256", this.getSecretHashPepper()).update(value).digest("hex"),
      version: SECRET_HASH_VERSION_HMAC_SHA256_V1
    };
  }

  private verifyStoredSecret(value: string, expectedHash: string, version?: string | null): boolean {
    const actualHash =
      version === SECRET_HASH_VERSION_HMAC_SHA256_V1
        ? this.hashSecret(value).hash
        : createHash("sha256").update(value).digest("hex");

    return this.isHashEqual(expectedHash, actualHash);
  }

  private needsSecretHashUpgrade(version?: string | null): boolean {
    return version !== SECRET_HASH_VERSION_HMAC_SHA256_V1;
  }

  private getSecretHashPepper(): string {
    const configuredPepper = this.configService?.get<string>("OPEN_INTEGRATION_SECRET_PEPPER")?.trim();

    if (configuredPepper) {
      return configuredPepper;
    }

    const fallbackSecret = this.configService?.get<string>("JWT_SECRET")?.trim();
    if (fallbackSecret) {
      return fallbackSecret;
    }

    if (this.configService && !isLocalRuntime(this.configService)) {
      throw new Error("OPEN_INTEGRATION_SECRET_PEPPER is required outside local/test environments.");
    }

    return "local-open-integration-secret-pepper";
  }

  private encryptSecret(secret: string) {
    const key = this.getSecretEncryptionKey();
    const iv = randomBytes(SECRET_ENCRYPTION_IV_BYTES);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      ciphertext: [iv, tag, encrypted].map((item) => item.toString("base64url")).join("."),
      version: SECRET_CIPHER_VERSION_AES_256_GCM_V1
    };
  }

  private decryptSecret(ciphertext: string) {
    const [ivPart, tagPart, encryptedPart] = ciphertext.split(".");

    if (!ivPart || !tagPart || !encryptedPart) {
      throw new Error("Encrypted secret payload is malformed.");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.getSecretEncryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final()
    ]).toString("utf8");
  }

  private getSecretEncryptionKey(): Buffer {
    const configuredKey = this.configService?.get<string>("OPEN_INTEGRATION_SECRET_ENCRYPTION_KEY")?.trim();
    const material = configuredKey || this.configService?.get<string>("JWT_SECRET")?.trim();

    if (!material) {
      if (this.configService && !isLocalRuntime(this.configService)) {
        throw new Error("OPEN_INTEGRATION_SECRET_ENCRYPTION_KEY is required outside local/test environments.");
      }

      return createHash("sha256").update("local-open-integration-secret-encryption-key").digest();
    }

    if (/^[A-Za-z0-9_-]{43}$/.test(material)) {
      const decoded = Buffer.from(material, "base64url");
      if (decoded.length === SECRET_ENCRYPTION_KEY_BYTES) {
        return decoded;
      }
    }

    return createHash("sha256").update(material).digest();
  }

  private resolveWebhookSigningSecret(subscription: WebhookSubscriptionRecord) {
    if (
      subscription.signingSecretVersion === SECRET_CIPHER_VERSION_AES_256_GCM_V1 &&
      subscription.signingSecretCiphertext
    ) {
      return this.decryptSecret(subscription.signingSecretCiphertext);
    }

    return subscription.signingSecret;
  }

  private isHashEqual(expectedHash: string, actualHash: string): boolean {
    const expected = Buffer.from(expectedHash, "hex");
    const actual = Buffer.from(actualHash, "hex");

    if (expected.length !== actual.length) {
      return false;
    }

    return timingSafeEqual(expected, actual);
  }

  private buildThrottleKey(...parts: string[]): string {
    return parts.map((part) => part.trim().toLowerCase()).join(":");
  }

  private buildSecretHint(secret: string) {
    return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
  }

  private signWebhookPayload(secret: string, payload: Record<string, unknown>) {
    return `sha256=${createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex")}`;
  }

  private getWebhookTestMode(): WebhookTestMode {
    const configuredMode = this.configService?.get<string>("WEBHOOK_TEST_MODE")?.trim().toUpperCase();

    return configuredMode === "SIMULATION" ? "SIMULATION" : "REAL";
  }

  private async runWebhookTestDelivery(
    subscription: WebhookSubscriptionRecord,
    payload: Record<string, unknown>,
    signature: string
  ): Promise<WebhookDeliveryResult> {
    if (this.getWebhookTestMode() === "SIMULATION") {
      return this.simulateWebhookDelivery(subscription.endpointUrl, subscription.maxAttempts);
    }

    return this.deliverWebhookTest(subscription, payload, signature);
  }

  private simulateWebhookDelivery(endpointUrl: string, maxAttempts: number): WebhookDeliveryResult {
    if (!/^https?:\/\//.test(endpointUrl)) {
      return {
        status: WebhookDeliveryStatus.FAILED,
        attemptCount: 1,
        responseStatusCode: 400,
        responseBody: "simulation:invalid_endpoint",
        errorMessage: "回调地址必须以 http:// 或 https:// 开头。",
        nextRetryAt: null,
        deliveredAt: null,
        deliveryMode: "SIMULATION",
        durationMs: 0
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
        responseBody: "simulation:accepted",
        errorMessage: null,
        nextRetryAt: null,
        deliveredAt: new Date(),
        deliveryMode: "SIMULATION",
        durationMs: 0
      };
    }

    return {
      status: WebhookDeliveryStatus.FAILED,
      attemptCount,
      responseStatusCode: 502,
      responseBody: "simulation:upstream_failed",
      errorMessage: `模拟回调连续失败，已执行 ${attemptCount} 次重试。`,
      nextRetryAt: null,
      deliveredAt: null,
      deliveryMode: "SIMULATION",
      durationMs: 0
    };
  }

  private async deliverWebhookTest(
    subscription: WebhookSubscriptionRecord,
    payload: Record<string, unknown>,
    signature: string
  ): Promise<WebhookDeliveryResult> {
    const startedAt = Date.now();

    try {
      const endpoint = await this.assertWebhookEndpointAllowed(subscription.endpointUrl);
      let lastResult: WebhookDeliveryResult | null = null;

      for (let attempt = 1; attempt <= subscription.maxAttempts; attempt += 1) {
        lastResult = await this.sendWebhookAttempt(endpoint, subscription, payload, signature, attempt, startedAt);

        if (lastResult.status === WebhookDeliveryStatus.SUCCEEDED) {
          return lastResult;
        }
      }

      return (
        lastResult ?? {
          status: WebhookDeliveryStatus.FAILED,
          attemptCount: 0,
          responseStatusCode: null,
          responseBody: null,
          errorMessage: "真实投递未执行。",
          nextRetryAt: null,
          deliveredAt: null,
          deliveryMode: "REAL",
          durationMs: Date.now() - startedAt
        }
      );
    } catch (error) {
      return {
        status: WebhookDeliveryStatus.FAILED,
        attemptCount: 1,
        responseStatusCode: null,
        responseBody: null,
        errorMessage: error instanceof Error ? error.message : "真实投递失败。",
        nextRetryAt: null,
        deliveredAt: null,
        deliveryMode: "REAL",
        durationMs: Date.now() - startedAt
      };
    }
  }

  private async sendWebhookAttempt(
    endpoint: URL,
    subscription: WebhookSubscriptionRecord,
    payload: Record<string, unknown>,
    signature: string,
    attempt: number,
    startedAt: number
  ): Promise<WebhookDeliveryResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), subscription.timeoutSeconds * 1000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        redirect: "manual",
        signal: abortController.signal,
        headers: {
          "content-type": "application/json",
          "x-platform-signature": signature,
          "x-platform-event": String(payload.eventType),
          "x-platform-delivery-mode": "real"
        },
        body: JSON.stringify(payload)
      });
      const responseBody = await this.readClippedResponseBody(response);
      const isRedirect = response.status >= 300 && response.status < 400;
      const succeeded = response.status >= 200 && response.status < 300;

      return {
        status: succeeded ? WebhookDeliveryStatus.SUCCEEDED : WebhookDeliveryStatus.FAILED,
        attemptCount: attempt,
        responseStatusCode: response.status,
        responseBody,
        errorMessage: succeeded
          ? null
          : isRedirect
            ? "真实投递禁止跟随重定向。"
            : `真实投递返回 HTTP ${response.status}。`,
        nextRetryAt: null,
        deliveredAt: succeeded ? new Date() : null,
        deliveryMode: "REAL",
        durationMs: Date.now() - startedAt
      };
    } catch (error) {
      return {
        status: WebhookDeliveryStatus.FAILED,
        attemptCount: attempt,
        responseStatusCode: null,
        responseBody: null,
        errorMessage:
          error instanceof Error && error.name === "AbortError"
            ? `真实投递超过 ${subscription.timeoutSeconds} 秒超时。`
            : error instanceof Error
              ? error.message
              : "真实投递失败。",
        nextRetryAt: null,
        deliveredAt: null,
        deliveryMode: "REAL",
        durationMs: Date.now() - startedAt
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async assertWebhookEndpointAllowed(endpointUrl: string): Promise<URL> {
    let endpoint: URL;

    try {
      endpoint = new URL(endpointUrl);
    } catch {
      throw new BadRequestException("回调地址格式不正确。");
    }

    if (!["http:", "https:"].includes(endpoint.protocol)) {
      throw new BadRequestException("回调地址只允许 http:// 或 https:// 协议。");
    }

    if (!endpoint.hostname) {
      throw new BadRequestException("回调地址缺少主机名。");
    }

    if (isIP(endpoint.hostname)) {
      this.assertPublicIpAddress(endpoint.hostname);
      return endpoint;
    }

    if (endpoint.hostname.toLowerCase() === "localhost") {
      throw new BadRequestException("真实 Webhook 测试不允许投递到 localhost。");
    }

    this.assertWebhookDomainAllowed(endpoint.hostname);

    const records = await lookup(endpoint.hostname, {
      all: true,
      verbatim: true
    });

    if (!records.length) {
      throw new BadRequestException("回调地址域名无法解析。");
    }

    for (const record of records) {
      this.assertPublicIpAddress(record.address);
    }

    return endpoint;
  }

  private assertWebhookDomainAllowed(hostname: string): void {
    const allowedDomains = this.configService
      ?.get<string>("WEBHOOK_ALLOWED_DOMAINS")
      ?.split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedDomains?.length) {
      return;
    }

    const normalizedHostname = hostname.toLowerCase();
    const isAllowed = allowedDomains.some((domain) => {
      const normalizedDomain = domain.startsWith("*.") ? domain.slice(2) : domain;

      if (normalizedHostname === normalizedDomain) {
        return true;
      }

      return domain.startsWith("*.") && normalizedHostname.endsWith(`.${normalizedDomain}`);
    });

    if (!isAllowed) {
      throw new BadRequestException("Webhook 目标域名不在允许名单内。");
    }
  }

  private assertPublicIpAddress(address: string): void {
    const version = isIP(address);

    if (version === 4 && this.isPrivateIpv4(address)) {
      throw new BadRequestException("真实 Webhook 测试不允许投递到内网或本机地址。");
    }

    if (version === 6 && this.isPrivateIpv6(address)) {
      throw new BadRequestException("真实 Webhook 测试不允许投递到内网或本机地址。");
    }

    if (!version) {
      throw new BadRequestException("回调地址解析到了无效 IP。");
    }
  }

  private isPrivateIpv4(address: string): boolean {
    const [first = 0, second = 0] = address.split(".").map((part) => Number(part));

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first >= 224
    );
  }

  private isPrivateIpv6(address: string): boolean {
    const normalized = address.toLowerCase();

    // SSRF 防护优先拦截本机、未指定、唯一本地、链路本地、组播和 IPv4 映射地址。
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80") ||
      normalized.startsWith("ff") ||
      normalized.startsWith("::ffff:")
    );
  }

  private async readClippedResponseBody(response: Response): Promise<string | null> {
    const rawBody = await response.text().catch(() => "");

    if (!rawBody) {
      return null;
    }

    return rawBody.length > WEBHOOK_RESPONSE_BODY_LIMIT
      ? `${rawBody.slice(0, WEBHOOK_RESPONSE_BODY_LIMIT)}...(truncated)`
      : rawBody;
  }

  private readStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private readJobPayload(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private readRequiredPayloadString(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];

    if (typeof value !== "string" || !value) {
      throw new BadRequestException(`Background job payload is missing ${key}.`);
    }

    return value;
  }

  private readOptionalPayloadString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];

    return typeof value === "string" && value ? value : undefined;
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
    const payloadMetadata =
      record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
        ? (record.payload as Record<string, unknown>)
        : {};
    const responseBody = record.responseBody ?? null;
    const inferredDeliveryMode =
      payloadMetadata.deliveryMode === "REAL" || payloadMetadata.deliveryMode === "SIMULATION"
        ? payloadMetadata.deliveryMode
        : responseBody?.startsWith("simulation:")
          ? "SIMULATION"
          : "REAL";
    const durationMs = typeof payloadMetadata.durationMs === "number" ? payloadMetadata.durationMs : null;

    return {
      id: record.id,
      eventType: record.eventType,
      sourceType: record.sourceType,
      sourceId: record.sourceId,
      status: record.status,
      attemptCount: record.attemptCount,
      deliveryMode: inferredDeliveryMode,
      durationMs,
      signature: record.signature,
      responseStatusCode: record.responseStatusCode ?? null,
      responseBody,
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
