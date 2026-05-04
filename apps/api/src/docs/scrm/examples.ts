import type { OpenAPIObject } from "@nestjs/swagger";

import {
  applyStandardErrorExample,
  getOperation,
  getSchemaExample,
  setJsonRequestExample,
  setJsonSuccessExample,
  setMultipartRequestExample
} from "../shared/openapi-helpers";

function applyScrmSchemaExamples(document: OpenAPIObject): void {
  const schemas = document.components?.schemas as Record<string, any> | undefined;

  if (schemas?.PaginatedCustomersResponseVo) {
    schemas.PaginatedCustomersResponseVo.example = {
      items: [
        {
          id: "cust_001",
          name: "上海示例科技有限公司",
          contactName: "王小明",
          phone: "13800000000",
          email: "contact@example.com",
          source: "官网注册",
          status: "ACTIVE",
          notes: "重点客户",
          ownerId: "user_001",
          owner: { id: "user_001", displayName: "演示管理员" },
          tags: [{ tag: { id: "tag_vip", name: "VIP", color: "#FF7A45" } }],
          attachments: [],
          createdAt: "2026-05-01T09:00:00.000Z",
          updatedAt: "2026-05-03T10:30:00.000Z"
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      sortBy: "createdAt",
      sortOrder: "desc"
    };
  }

  if (schemas?.PaginatedLeadsResponseVo) {
    schemas.PaginatedLeadsResponseVo.example = {
      items: [
        {
          id: "lead_001",
          name: "华北制造业商机线索",
          contactName: "李晓华",
          phone: "13900000000",
          source: "市场活动",
          status: "NEW",
          notes: "需一周内首联",
          ownerId: "user_002",
          owner: { id: "user_002", displayName: "销售顾问A" },
          convertedCustomerId: null,
          convertedCustomer: null,
          attachments: [],
          createdAt: "2026-05-02T08:00:00.000Z",
          updatedAt: "2026-05-03T09:00:00.000Z"
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      sortBy: "createdAt",
      sortOrder: "desc"
    };
  }

  if (schemas?.PaginatedSalesOpportunitiesResponseVo) {
    schemas.PaginatedSalesOpportunitiesResponseVo.example = {
      items: [
        {
          id: "opp_001",
          name: "华东区域年度框架合作",
          customerId: "cust_001",
          customer: {
            id: "cust_001",
            name: "上海示例科技有限公司",
            contactName: "王小明",
            phone: "13800000000"
          },
          sourceLeadId: "lead_001",
          sourceLead: {
            id: "lead_001",
            name: "华北制造业商机线索",
            contactName: "李晓华",
            phone: "13900000000"
          },
          ownerId: "user_002",
          owner: { id: "user_002", displayName: "销售顾问A" },
          stage: "DISCOVERY",
          resultStatus: "IN_PROGRESS",
          expectedAmount: 188000,
          expectedCloseDate: "2026-06-30T00:00:00.000Z",
          nextAction: "安排方案演示",
          notes: "客户对实施周期较敏感",
          closedAt: null,
          lostReason: null,
          stageHistory: [],
          quotes: [],
          contracts: [],
          paymentPlans: [],
          paymentRecords: [],
          renewalReminders: [],
          createdAt: "2026-05-02T10:00:00.000Z",
          updatedAt: "2026-05-03T11:00:00.000Z"
        }
      ],
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
      sortBy: "createdAt",
      sortOrder: "desc"
    };
  }
}

export function applyScrmOpenApiExamples(document: OpenAPIObject): void {
  applyScrmSchemaExamples(document);

  const customersListOperation = getOperation(document, "/api/customers", "get");
  const customerDetailOperation = getOperation(document, "/api/customers/{id}", "get");
  const createCustomerOperation = getOperation(document, "/api/customers", "post");
  const leadsListOperation = getOperation(document, "/api/leads", "get");
  const leadDetailOperation = getOperation(document, "/api/leads/{id}", "get");
  const createLeadOperation = getOperation(document, "/api/leads", "post");
  const leadConvertOperation = getOperation(document, "/api/leads/{id}/convert", "post");
  const opportunitiesListOperation = getOperation(document, "/api/sales-opportunities", "get");
  const opportunityDetailOperation = getOperation(document, "/api/sales-opportunities/{id}", "get");
  const createOpportunityOperation = getOperation(document, "/api/sales-opportunities", "post");
  const opportunityWonOperation = getOperation(document, "/api/sales-opportunities/{id}/mark-won", "patch");
  const opportunityLostOperation = getOperation(document, "/api/sales-opportunities/{id}/mark-lost", "patch");
  const uploadOperation = getOperation(document, "/api/uploads", "post");
  const batchTaskImportOperation = getOperation(document, "/api/batch-tasks/customers/import", "post");
  const batchTaskDetailOperation = getOperation(document, "/api/batch-tasks/{id}", "get");
  const batchTaskFailuresOperation = getOperation(document, "/api/batch-tasks/{id}/failures", "get");

  const customerPageExample = getSchemaExample<Record<string, any>>(document, "PaginatedCustomersResponseVo");
  const leadPageExample = getSchemaExample<Record<string, any>>(document, "PaginatedLeadsResponseVo");
  const opportunityPageExample = getSchemaExample<Record<string, any>>(document, "PaginatedSalesOpportunitiesResponseVo");

  setJsonSuccessExample(customersListOperation, "客户分页结果", customerPageExample);
  setJsonSuccessExample(customerDetailOperation, "客户详情", customerPageExample?.items?.[0]);
  setJsonRequestExample(createCustomerOperation, "创建客户请求", {
    name: "上海示例科技有限公司",
    contactName: "王小明",
    phone: "13800000000",
    email: "contact@example.com",
    source: "官网注册",
    status: "ACTIVE",
    notes: "重点客户",
    ownerId: "user_001",
    tagIds: ["tag_vip"]
  });
  applyStandardErrorExample(customersListOperation, 401, "/api/customers", "当前请求没有有效登录身份");
  applyStandardErrorExample(customersListOperation, 403, "/api/customers", "当前账号没有客户查询权限");

  setJsonSuccessExample(leadsListOperation, "线索分页结果", leadPageExample);
  setJsonSuccessExample(leadDetailOperation, "线索详情", leadPageExample?.items?.[0]);
  setJsonRequestExample(createLeadOperation, "创建线索请求", {
    name: "华北制造业商机线索",
    contactName: "李晓华",
    phone: "13900000000",
    source: "市场活动",
    notes: "需一周内首联",
    ownerId: "user_002"
  });
  setJsonSuccessExample(leadConvertOperation, "线索转客户后结果", {
    ...(leadPageExample?.items?.[0] ?? {}),
    status: "CONVERTED",
    convertedCustomerId: "cust_001",
    convertedCustomer: {
      id: "cust_001",
      name: "上海示例科技有限公司",
      contactName: "王小明",
      phone: "13800000000",
      source: "市场活动",
      status: "ACTIVE",
      ownerId: "user_002"
    }
  });
  applyStandardErrorExample(leadsListOperation, 401, "/api/leads", "当前请求没有有效登录身份");
  applyStandardErrorExample(leadsListOperation, 403, "/api/leads", "当前账号没有线索查询权限");

  setJsonSuccessExample(opportunitiesListOperation, "商机分页结果", opportunityPageExample);
  setJsonSuccessExample(opportunityDetailOperation, "商机详情", opportunityPageExample?.items?.[0]);
  setJsonRequestExample(createOpportunityOperation, "创建商机请求", {
    name: "华东区域年度框架合作",
    customerId: "cust_001",
    sourceLeadId: "lead_001",
    ownerId: "user_002",
    stage: "DISCOVERY",
    expectedAmount: 188000,
    expectedCloseDate: "2026-06-30T00:00:00.000Z",
    nextAction: "安排方案演示",
    notes: "客户对实施周期较敏感"
  });
  setJsonRequestExample(opportunityWonOperation, "赢单收口请求", {
    comment: "客户确认签约，进入合同创建阶段"
  });
  setJsonSuccessExample(opportunityWonOperation, "赢单收口结果", {
    ...(opportunityPageExample?.items?.[0] ?? {}),
    stage: "CLOSED_WON",
    resultStatus: "WON"
  });
  setJsonRequestExample(opportunityLostOperation, "输单收口请求", {
    lostReason: "预算冻结",
    comment: "客户本季度暂停采购"
  });
  setJsonSuccessExample(opportunityLostOperation, "输单收口结果", {
    ...(opportunityPageExample?.items?.[0] ?? {}),
    stage: "CLOSED_LOST",
    resultStatus: "LOST",
    lostReason: "预算冻结"
  });
  applyStandardErrorExample(opportunitiesListOperation, 401, "/api/sales-opportunities", "当前请求没有有效登录身份");
  applyStandardErrorExample(opportunitiesListOperation, 403, "/api/sales-opportunities", "当前账号没有商机查询权限");

  setMultipartRequestExample(uploadOperation, "客户附件上传", {
    businessType: "CUSTOMER",
    businessId: "cust_001",
    file: "(binary)"
  });

  setMultipartRequestExample(batchTaskImportOperation, "客户导入任务请求", {
    ownerId: "user_001",
    file: "(binary csv)"
  });
  setJsonSuccessExample(batchTaskImportOperation, "客户导入任务已创建", {
    id: "task_import_001",
    category: "IMPORT",
    resourceType: "CUSTOMER",
    label: "客户导入任务",
    status: "PENDING",
    progress: 0,
    totalCount: 0,
    successCount: 0,
    failureCount: 0,
    filterSnapshot: null,
    summary: "等待导入处理",
    failureSummary: null,
    inputFileName: "customers-import.csv",
    resultFileName: null,
    failureFileName: null,
    operator: {
      id: "user_001",
      displayName: "演示管理员"
    },
    startedAt: null,
    finishedAt: null,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:00:00.000Z"
  });
  setJsonSuccessExample(batchTaskDetailOperation, "批任务详情", {
    id: "task_import_001",
    category: "IMPORT",
    resourceType: "CUSTOMER",
    label: "客户导入任务",
    status: "FAILED",
    progress: 100,
    totalCount: 10,
    successCount: 8,
    failureCount: 2,
    filterSnapshot: null,
    summary: "导入完成，存在失败记录",
    failureSummary: "第 3 行手机号重复，第 7 行客户名称缺失",
    inputFileName: "customers-import.csv",
    resultFileName: null,
    failureFileName: "customers-import-failures.csv",
    operator: {
      id: "user_001",
      displayName: "演示管理员"
    },
    startedAt: "2026-05-04T12:00:10.000Z",
    finishedAt: "2026-05-04T12:02:30.000Z",
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:02:30.000Z"
  });
  setJsonSuccessExample(batchTaskFailuresOperation, "批任务失败明细", [
    {
      id: "task_failure_001",
      rowNumber: 3,
      identifier: "13800000000",
      reason: "手机号已存在。",
      payload: {
        phone: "13800000000",
        name: "重复客户A"
      },
      createdAt: "2026-05-04T12:02:00.000Z"
    }
  ]);
  applyStandardErrorExample(batchTaskImportOperation, 400, "/api/batch-tasks/customers/import", "导入文件格式不合法");
  applyStandardErrorExample(batchTaskImportOperation, 403, "/api/batch-tasks/customers/import", "当前账号没有客户导入权限");
  applyStandardErrorExample(batchTaskDetailOperation, 404, "/api/batch-tasks/{id}", "未找到指定批处理任务");
}
