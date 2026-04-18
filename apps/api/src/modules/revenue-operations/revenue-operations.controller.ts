import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "@/common/auth/auth-user.interface";
import { ActionPermission } from "@/common/decorators/action-permission.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Permissions } from "@/common/decorators/permissions.decorator";
import { CreateContractDto } from "./dto/create-contract.dto";
import { CreatePaymentPlanDto } from "./dto/create-payment-plan.dto";
import { CreatePaymentRecordDto } from "./dto/create-payment-record.dto";
import { CreateQuoteDto } from "./dto/create-quote.dto";
import { CreateRenewalReminderDto } from "./dto/create-renewal-reminder.dto";
import { RevenueOperationsService } from "./revenue-operations.service";
import {
  ContractVo,
  CustomerRevenueOverviewVo,
  OpportunityRevenueOverviewVo,
  PaymentPlanVo,
  PaymentRecordVo,
  QuoteVo,
  RenewalReminderVo
} from "./vo/revenue-operations.vo";

@ApiTags("revenue-operations")
@ApiBearerAuth()
@Controller("revenue-operations")
export class RevenueOperationsController {
  constructor(private readonly revenueOperationsService: RevenueOperationsService) {}

  @Get("opportunities/:opportunityId")
  @Permissions("opportunity:read")
  @ApiOperation({
    summary: "查询商机上下文经营摘要",
    description: "查询指定赢单商机上下文下的报价、合同、回款和续费摘要。"
  })
  @ApiOkResponse({
    type: OpportunityRevenueOverviewVo
  })
  getOpportunityOverview(@Param("opportunityId") opportunityId: string, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.getOpportunityOverview(opportunityId, user);
  }

  @Get("customers/:customerId")
  @Permissions("customer:read")
  @ApiOperation({
    summary: "查询客户上下文经营摘要",
    description: "查询指定客户上下文下的报价、合同、回款和续费摘要。"
  })
  @ApiOkResponse({
    type: CustomerRevenueOverviewVo
  })
  getCustomerOverview(@Param("customerId") customerId: string, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.getCustomerOverview(customerId, user);
  }

  @Post("quotes")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建报价单",
    description: "在赢单商机上下文中创建报价单。"
  })
  @ApiOkResponse({
    type: QuoteVo
  })
  createQuote(@Body() dto: CreateQuoteDto, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.createQuote(dto, user);
  }

  @Post("contracts")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建合同",
    description: "在赢单商机上下文中创建合同。"
  })
  @ApiOkResponse({
    type: ContractVo
  })
  createContract(@Body() dto: CreateContractDto, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.createContract(dto, user);
  }

  @Post("payment-plans")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建回款计划",
    description: "在赢单商机或合同上下文中创建回款计划。"
  })
  @ApiOkResponse({
    type: PaymentPlanVo
  })
  createPaymentPlan(@Body() dto: CreatePaymentPlanDto, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.createPaymentPlan(dto, user);
  }

  @Post("payment-records")
  @Permissions("opportunity:write")
  @ActionPermission("revenue", "confirm-payment")
  @ApiOperation({
    summary: "登记回款记录",
    description: "在回款计划上下文中登记实际回款记录。"
  })
  @ApiOkResponse({
    type: PaymentRecordVo
  })
  createPaymentRecord(@Body() dto: CreatePaymentRecordDto, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.createPaymentRecord(dto, user);
  }

  @Post("renewal-reminders")
  @Permissions("opportunity:write")
  @ApiOperation({
    summary: "创建续费提醒",
    description: "在客户、合同或赢单商机上下文中创建续费提醒。"
  })
  @ApiOkResponse({
    type: RenewalReminderVo
  })
  createRenewalReminder(@Body() dto: CreateRenewalReminderDto, @CurrentUser() user: AuthUser) {
    return this.revenueOperationsService.createRenewalReminder(dto, user);
  }
}
