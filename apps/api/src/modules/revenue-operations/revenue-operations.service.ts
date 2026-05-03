import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditActionType, OpportunityStage, PaymentPlanStatus, Prisma } from "@prisma/client";

import { AccessPolicyService } from "@/common/access-policy/access-policy.service";
import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { requireTenantId } from "@/common/tenant/tenant.util";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationCenterService } from "../notification-center/notification-center.service";
import { OpenIntegrationService } from "../open-integration/open-integration.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { CreatePaymentPlanDto } from "./dto/create-payment-plan.dto";
import { CreatePaymentRecordDto } from "./dto/create-payment-record.dto";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { CreateRenewalReminderDto } from "./dto/create-renewal-reminder.dto";
import {
  mapContract,
  mapCustomerRevenueOverview,
  mapOpportunityRevenueOverview,
  mapPaymentPlan,
  mapPaymentRecord,
  mapQuote,
  mapRenewalReminder
} from "./revenue-operations.mapper";
import { RevenueOperationsRepository } from "./repositories/revenue-operations.repository";

@Injectable()
export class RevenueOperationsService {
  constructor(
    private readonly revenueOperationsRepository: RevenueOperationsRepository,
    private readonly dataScopeService: DataScopeService,
    private readonly auditLogsService: AuditLogsService,
    private readonly accessPolicyService: AccessPolicyService,
    private readonly notificationCenterService: NotificationCenterService,
    private readonly openIntegrationService: OpenIntegrationService
  ) {}

  async getOpportunityOverview(opportunityId: string, actor: AuthUser) {
    await this.dataScopeService.assertOpportunityAccessible(
      actor,
      opportunityId,
      "You cannot access revenue data outside your data scope."
    );
    const opportunity = await this.revenueOperationsRepository.findOpportunityOverview(opportunityId, requireTenantId(actor));

    return this.sanitizeOpportunityOverview(actor, mapOpportunityRevenueOverview(opportunity));
  }

  async getCustomerOverview(customerId: string, actor: AuthUser) {
    await this.dataScopeService.assertCustomerAccessible(
      actor,
      customerId,
      "You cannot access revenue data outside your data scope."
    );
    const customer = await this.revenueOperationsRepository.findCustomerOverview(customerId, requireTenantId(actor));

    return this.sanitizeCustomerOverview(actor, mapCustomerRevenueOverview(customer));
  }

  async createQuote(dto: CreateQuoteDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "quote", dto as unknown as Record<string, unknown>);
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);
    const record = await this.revenueOperationsRepository.createQuote({
      tenantId: requireTenantId(actor),
      quoteNo: this.generateCode("Q"),
      title: dto.title.trim(),
      amount: new Prisma.Decimal(dto.amount),
      issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : undefined,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      notes: dto.notes?.trim(),
      customerId: dto.customerId,
      opportunityId: dto.opportunityId,
      ownerId: opportunity.ownerId
    });

    await this.createAuditLog(actor, "revenue-quote", record.id, {
      quoteNo: record.quoteNo,
      opportunityId: dto.opportunityId
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "quote", mapQuote(record));
  }

  async createContract(dto: CreateContractDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "contract", dto as unknown as Record<string, unknown>);
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException("合同结束日期必须晚于开始日期。");
    }

    const record = await this.revenueOperationsRepository.createContract({
      tenantId: requireTenantId(actor),
      contractNo: this.generateCode("C"),
      title: dto.title.trim(),
      amount: new Prisma.Decimal(dto.amount),
      startDate,
      endDate,
      signedAt: dto.signedAt ? new Date(dto.signedAt) : undefined,
      notes: dto.notes?.trim(),
      customerId: dto.customerId,
      opportunityId: dto.opportunityId,
      ownerId: opportunity.ownerId
    });

    await this.createAuditLog(actor, "revenue-contract", record.id, {
      contractNo: record.contractNo,
      opportunityId: dto.opportunityId
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "contract", mapContract(record));
  }

  async createPaymentPlan(dto: CreatePaymentPlanDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "payment-plan", dto as unknown as Record<string, unknown>);
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);

    if (dto.contractId) {
      await this.assertContractMatches(dto.contractId, dto.customerId, dto.opportunityId, actor);
    }

    const record = await this.revenueOperationsRepository.createPaymentPlan({
      tenantId: requireTenantId(actor),
      title: dto.title.trim(),
      plannedAmount: new Prisma.Decimal(dto.plannedAmount),
      plannedDate: new Date(dto.plannedDate),
      notes: dto.notes?.trim(),
      customerId: dto.customerId,
      opportunityId: dto.opportunityId,
      contractId: dto.contractId,
      ownerId: opportunity.ownerId
    });

    await this.createAuditLog(actor, "revenue-payment-plan", record.id, {
      opportunityId: dto.opportunityId
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "payment-plan", mapPaymentPlan(record));
  }

  async createPaymentRecord(dto: CreatePaymentRecordDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "payment-record", dto as unknown as Record<string, unknown>);
    const paymentPlan = await this.revenueOperationsRepository.findPaymentPlanContextById(
      dto.paymentPlanId,
      requireTenantId(actor)
    );

    await this.dataScopeService.assertCustomerAccessible(
      actor,
      paymentPlan.customerId,
      "You cannot record revenue data outside your data scope."
    );

    const nextReceivedAmount = new Prisma.Decimal(paymentPlan.receivedAmount).plus(dto.amount);
    const plannedAmount = new Prisma.Decimal(paymentPlan.plannedAmount);
    const nextStatus =
      nextReceivedAmount.greaterThanOrEqualTo(plannedAmount) ? PaymentPlanStatus.PAID : PaymentPlanStatus.PARTIAL;

    const { record } = await this.revenueOperationsRepository.createPaymentRecord({
      tenantId: requireTenantId(actor),
      amount: new Prisma.Decimal(dto.amount),
      receivedAt: new Date(dto.receivedAt),
      note: dto.note?.trim(),
      customerId: paymentPlan.customerId,
      opportunityId: paymentPlan.opportunityId,
      contractId: paymentPlan.contractId ?? undefined,
      paymentPlanId: paymentPlan.id,
      ownerId: paymentPlan.ownerId,
      nextReceivedAmount,
      nextStatus
    });

    await this.createAuditLog(actor, "revenue-payment-record", record.id, {
      paymentPlanId: dto.paymentPlanId,
      opportunityId: paymentPlan.opportunityId
    });

    await this.openIntegrationService.dispatchBusinessWebhookEvent({
      tenantId: requireTenantId(actor),
      eventType: "REVENUE_PAYMENT_RECEIVED",
      sourceType: "payment-record",
      sourceId: record.id,
      payload: {
        paymentRecordId: record.id,
        paymentPlanId: paymentPlan.id,
        opportunityId: paymentPlan.opportunityId,
        customerId: paymentPlan.customerId,
        amount: dto.amount,
        nextStatus
      },
      actorId: actor.id,
      actorName: actor.displayName,
      occurredAt: new Date(dto.receivedAt)
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "payment-record", mapPaymentRecord(record));
  }

  async createRenewalReminder(dto: CreateRenewalReminderDto, actor: AuthUser) {
    this.accessPolicyService.assertWritableFields(actor, "renewal-reminder", dto as unknown as Record<string, unknown>);
    const contract = await this.assertContractMatches(
      dto.contractId,
      dto.customerId,
      dto.opportunityId,
      actor,
      dto.opportunityId === undefined
    );

    const record = await this.revenueOperationsRepository.createRenewalReminder({
      tenantId: requireTenantId(actor),
      title: dto.title.trim(),
      remindAt: new Date(dto.remindAt),
      note: dto.note?.trim(),
      customerId: dto.customerId,
      opportunityId: dto.opportunityId ?? contract.opportunityId,
      contractId: dto.contractId,
      ownerId: contract.ownerId
    });

    await this.createAuditLog(actor, "revenue-renewal-reminder", record.id, {
      contractId: dto.contractId,
      customerId: dto.customerId
    });

    await this.notificationCenterService.publishEvent({
      event: {
        tenantId: requireTenantId(actor),
        eventType: "RENEWAL_REMINDER",
        domain: "SCRM",
        sourceType: "renewal-reminder",
        sourceId: record.id,
        title: `${record.title}待跟进`,
        summary: record.note ?? "合同已进入续费窗口，请及时推进。",
        priority: this.resolveReminderPriority(record.remindAt),
        payload: {
          reminderId: record.id,
          customerId: record.customerId,
          contractId: record.contractId,
          opportunityId: record.opportunityId ?? null
        },
        targetPath: `/scrm/revenue-operations?customerId=${record.customerId}&opportunityId=${record.opportunityId ?? ""}`,
        targetLabel: "进入经营闭环",
        actorId: actor.id,
        occurredAt: record.remindAt
      },
      recipientIds: [record.ownerId],
      nudgeBaseAt: record.remindAt
    });

    return this.accessPolicyService.sanitizeReadFields(actor, "renewal-reminder", mapRenewalReminder(record));
  }

  private async assertWonOpportunityContext(opportunityId: string, customerId: string, actor: AuthUser) {
    const opportunity = await this.revenueOperationsRepository.findOpportunityContextById(
      opportunityId,
      requireTenantId(actor)
    );

    await this.dataScopeService.assertCustomerAccessible(
      actor,
      opportunity.customerId,
      "You cannot create revenue data outside your data scope."
    );

    if (opportunity.customerId !== customerId) {
      throw new BadRequestException("商机与客户上下文不匹配。");
    }

    if (opportunity.stage !== OpportunityStage.CLOSED_WON) {
      throw new BadRequestException("只有赢单商机可以创建成交后经营对象。");
    }

    return opportunity;
  }

  private async assertContractMatches(
    contractId: string,
    customerId: string,
    opportunityId: string | undefined,
    actor: AuthUser,
    allowImplicitOpportunity = false
  ) {
    const contract = await this.revenueOperationsRepository.findContractContextById(contractId, requireTenantId(actor));

    await this.dataScopeService.assertCustomerAccessible(
      actor,
      contract.customerId,
      "You cannot access revenue data outside your data scope."
    );

    if (contract.customerId !== customerId) {
      throw new BadRequestException("合同与客户上下文不匹配。");
    }

    if (!allowImplicitOpportunity && contract.opportunityId !== opportunityId) {
      throw new BadRequestException("合同与商机上下文不匹配。");
    }

    return contract;
  }

  private async createAuditLog(
    actor: AuthUser,
    targetType: string,
    targetId: string,
    detail: Prisma.InputJsonObject
  ) {
    await this.auditLogsService.create({
      actorId: actor.id,
      actorName: actor.displayName,
      actionType: AuditActionType.CREATE,
      targetType,
      targetId,
      detail
    });
  }

  private generateCode(prefix: string): string {
    const now = new Date();
    const dateSegment = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("");
    const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${dateSegment}-${randomSegment}`;
  }

  private resolveReminderPriority(referenceAt: Date) {
    const diff = referenceAt.getTime() - Date.now();

    if (diff <= 1000 * 60 * 60 * 24) {
      return "HIGH" as const;
    }

    if (diff <= 1000 * 60 * 60 * 24 * 3) {
      return "MEDIUM" as const;
    }

    return "LOW" as const;
  }

  private sanitizeOpportunityOverview(
    actor: AuthUser,
    payload: ReturnType<typeof mapOpportunityRevenueOverview>
  ): ReturnType<typeof mapOpportunityRevenueOverview> {
    return {
      ...payload,
      quotes: payload.quotes.map((item) => this.accessPolicyService.sanitizeReadFields(actor, "quote", item)),
      contracts: payload.contracts.map((item) => this.accessPolicyService.sanitizeReadFields(actor, "contract", item)),
      paymentPlans: payload.paymentPlans.map((item) =>
        this.accessPolicyService.sanitizeReadFields(actor, "payment-plan", item)
      ),
      paymentRecords: payload.paymentRecords.map((item) =>
        this.accessPolicyService.sanitizeReadFields(actor, "payment-record", item)
      ),
      renewalReminders: payload.renewalReminders.map((item) =>
        this.accessPolicyService.sanitizeReadFields(actor, "renewal-reminder", item)
      )
    };
  }

  private sanitizeCustomerOverview(actor: AuthUser, payload: ReturnType<typeof mapCustomerRevenueOverview>) {
    return this.sanitizeOpportunityOverview(actor, payload as ReturnType<typeof mapOpportunityRevenueOverview>);
  }
}
