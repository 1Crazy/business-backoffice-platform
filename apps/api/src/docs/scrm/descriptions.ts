import type { SchemaDescriptionModule } from "../shared/schema-descriptions";

export const SCRM_SCHEMA_DESCRIPTIONS: SchemaDescriptionModule = {
  schemaDescriptions: {
    CreateCustomerDto: "创建客户时可填写的基础资料。",
    CustomerVo: "客户详情与聚合信息。",
    PaginatedCustomersResponseVo: "客户分页查询返回结构。",
    PaginatedResponseDto: "统一分页响应基类。"
  },
  propertyDescriptions: {
    "LeadVo.id": "线索 ID。",
    "LeadVo.ownerId": "当前负责该线索的员工 ID。",
    "LeadVo.status": "线索状态。NEW=新线索；CONTACTED=已联系；QUALIFIED=已确认有效；CONVERTED=已转客户；CLOSED=已关闭。",
    "LeadVo.convertedCustomerId": "该线索成功转化后生成的客户 ID。",
    "LeadReminderVo.id": "线索跟进提醒 ID。",
    "LeadReminderVo.status": "提醒状态。PENDING=待处理；DONE=已完成；CANCELLED=已取消。",
    "CustomerVo.id": "客户 ID。",
    "CustomerVo.ownerId": "当前负责该客户的员工 ID。",
    "SalesOpportunityVo.id": "商机 ID。",
    "SalesOpportunityVo.customerId": "该商机关联的客户 ID。",
    "SalesOpportunityVo.ownerId": "当前负责该商机的员工 ID。",
    "SalesOpportunityVo.sourceLeadId": "该商机来源线索的 ID；由线索转化创建时返回。",
    "SalesOpportunityVo.stage":
      "当前阶段。DISCOVERY=需求发现；QUALIFICATION=资格确认；PROPOSAL=方案/报价；NEGOTIATION=商务谈判；CLOSED_WON=赢单；CLOSED_LOST=输单。",
    "SalesOpportunityVo.resultStatus": "结果状态。IN_PROGRESS=推进中；WON=赢单；LOST=输单。",
    "AttachmentVo.id": "附件 ID。",
    "AttachmentVo.businessId": "附件归属的业务对象 ID。",
    "AttachmentVo.businessType": "附件所属业务类型。CUSTOMER=客户附件；LEAD=线索附件；OTHER=其他业务附件。"
  },
  enumDescriptions: {
    LeadStatus: {
      NEW: "新录入线索，尚未跟进。",
      CONTACTED: "已首次联系线索。",
      QUALIFIED: "已确认具有继续推进价值。",
      DISQUALIFIED: "已判定为无效线索。",
      CONVERTED: "已成功转化为客户。"
    },
    ReminderStatus: {
      PENDING: "待处理提醒。",
      COMPLETED: "提醒已处理完成。",
      CANCELLED: "提醒已取消。"
    },
    OpportunityStage: {
      DISCOVERY: "需求发现阶段。",
      QUALIFICATION: "商机资格确认阶段。",
      PROPOSAL: "方案 / 报价推进阶段。",
      NEGOTIATION: "商务谈判阶段。",
      CLOSED_WON: "赢单收口阶段。",
      CLOSED_LOST: "输单收口阶段。"
    },
    OpportunityResultStatus: {
      IN_PROGRESS: "商机仍在推进中。",
      WON: "商机已赢单。",
      LOST: "商机已输单。"
    },
    AttachmentBusinessType: {
      CUSTOMER: "客户附件。",
      LEAD: "线索附件。",
      OTHER: "其他业务附件。"
    }
  }
};
