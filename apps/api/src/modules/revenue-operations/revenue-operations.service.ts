import { BadRequestException, Injectable } from "@nestjs/common";
import { AuditActionType, OpportunityStage, PaymentPlanStatus, Prisma } from "@prisma/client";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { DataScopeService } from "@/common/data-scope/data-scope.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
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
import { RevenueOperationsRepository } from "./revenue-operations.repository";

@Injectable()
export class RevenueOperationsService {
  constructor(
    private readonly revenueOperationsRepository: RevenueOperationsRepository,
    private readonly dataScopeService: DataScopeService,
    private readonly auditLogsService: AuditLogsService
  ) {}

  async getOpportunityOverview(opportunityId: string, actor: AuthUser) {
    const opportunity = await this.revenueOperationsRepository.findOpportunityOverview(opportunityId);

    await this.dataScopeService.assertOwnerAccessible(
      actor,
      opportunity.ownerId,
      "You cannot access revenue data outside your data scope."
    );

    return mapOpportunityRevenueOverview(opportunity);
  }

  async getCustomerOverview(customerId: string, actor: AuthUser) {
    const customer = await this.revenueOperationsRepository.findCustomerOverview(customerId);

    await this.dataScopeService.assertOwnerAccessible(
      actor,
      customer.ownerId,
      "You cannot access revenue data outside your data scope."
    );

    return mapCustomerRevenueOverview(customer);
  }

  async createQuote(dto: CreateQuoteDto, actor: AuthUser) {
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);
    const record = await this.revenueOperationsRepository.createQuote({
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

    return mapQuote(record);
  }

  async createContract(dto: CreateContractDto, actor: AuthUser) {
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException("合同结束日期必须晚于开始日期。");
    }

    const record = await this.revenueOperationsRepository.createContract({
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

    return mapContract(record);
  }

  async createPaymentPlan(dto: CreatePaymentPlanDto, actor: AuthUser) {
    const opportunity = await this.assertWonOpportunityContext(dto.opportunityId, dto.customerId, actor);

    if (dto.contractId) {
      await this.assertContractMatches(dto.contractId, dto.customerId, dto.opportunityId, actor);
    }

    const record = await this.revenueOperationsRepository.createPaymentPlan({
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

    return mapPaymentPlan(record);
  }

  async createPaymentRecord(dto: CreatePaymentRecordDto, actor: AuthUser) {
    const paymentPlan = await this.revenueOperationsRepository.findPaymentPlanContextById(dto.paymentPlanId);

    await this.dataScopeService.assertOwnerAccessible(
      actor,
      paymentPlan.ownerId,
      "You cannot record revenue data outside your data scope."
    );

    const nextReceivedAmount = new Prisma.Decimal(paymentPlan.receivedAmount).plus(dto.amount);
    const plannedAmount = new Prisma.Decimal(paymentPlan.plannedAmount);
    const nextStatus =
      nextReceivedAmount.greaterThanOrEqualTo(plannedAmount) ? PaymentPlanStatus.PAID : PaymentPlanStatus.PARTIAL;

    const { record } = await this.revenueOperationsRepository.createPaymentRecord({
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

    return mapPaymentRecord(record);
  }

  async createRenewalReminder(dto: CreateRenewalReminderDto, actor: AuthUser) {
    const contract = await this.assertContractMatches(
      dto.contractId,
      dto.customerId,
      dto.opportunityId,
      actor,
      dto.opportunityId === undefined
    );

    const record = await this.revenueOperationsRepository.createRenewalReminder({
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

    return mapRenewalReminder(record);
  }

  private async assertWonOpportunityContext(opportunityId: string, customerId: string, actor: AuthUser) {
    const opportunity = await this.revenueOperationsRepository.findOpportunityContextById(opportunityId);

    await this.dataScopeService.assertOwnerAccessible(
      actor,
      opportunity.ownerId,
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
    const contract = await this.revenueOperationsRepository.findContractContextById(contractId);

    await this.dataScopeService.assertOwnerAccessible(
      actor,
      contract.ownerId,
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
}
