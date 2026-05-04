import type { OpenAPIObject } from "@nestjs/swagger";

import {
  applyStandardErrorExample,
  getOperation,
  setJsonRequestExample,
  setJsonSuccessExample
} from "../shared/openapi-helpers";

export function applyOaOpenApiExamples(document: OpenAPIObject): void {
  const workflowPendingTasksOperation = getOperation(document, "/api/workflows/tasks/pending", "get");
  const workflowApproveOperation = getOperation(document, "/api/workflows/tasks/{taskId}/approve", "post");
  const workflowRejectOperation = getOperation(document, "/api/workflows/tasks/{taskId}/reject", "post");
  const workflowStartByIdOperation = getOperation(document, "/api/workflows/templates/{id}/start", "post");
  const workflowInstanceDetailOperation = getOperation(document, "/api/workflows/instances/{id}", "get");
  const notificationListOperation = getOperation(document, "/api/notification-center/notifications", "get");
  const notificationReadOperation = getOperation(document, "/api/notification-center/notifications/{id}/read", "post");
  const notificationPreferencesOperation = getOperation(document, "/api/notification-center/preferences", "put");

  setJsonSuccessExample(workflowPendingTasksOperation, "待处理流程任务列表", [
    {
      id: "wf_task_001",
      instanceId: "wf_inst_001",
      nodeKey: "manager_approval",
      nodeName: "直属主管审批",
      title: "采购申请 - MacBook Pro",
      businessKey: "oa-purchase-001",
      status: "IN_PROGRESS",
      template: {
        id: "wf_tpl_001",
        key: "purchase_request",
        name: "采购申请",
        version: 3
      },
      applicant: {
        id: "user_003",
        displayName: "张小北"
      },
      formData: {
        itemName: "MacBook Pro 16",
        quantity: 1,
        budgetAmount: 18999
      },
      submittedAt: "2026-05-04T09:30:00.000Z"
    }
  ]);

  setJsonRequestExample(workflowApproveOperation, "通过任务请求", {
    comment: "同意采购，进入下一级审批"
  });
  setJsonRequestExample(workflowRejectOperation, "驳回任务请求", {
    comment: "预算说明不足，请补充采购理由"
  });
  setJsonRequestExample(workflowStartByIdOperation, "发起流程请求", {
    title: "采购申请 - MacBook Pro",
    businessKey: "oa-purchase-001",
    formData: {
      itemName: "MacBook Pro 16",
      quantity: 1,
      budgetAmount: 18999,
      neededBy: "2026-05-20"
    },
    ccUserIds: ["user_finance_001"]
  });
  setJsonSuccessExample(workflowStartByIdOperation, "流程实例已创建", {
    id: "wf_inst_001",
    title: "采购申请 - MacBook Pro",
    businessKey: "oa-purchase-001",
    status: "IN_PROGRESS",
    currentNodeKey: "manager_approval",
    template: {
      id: "wf_tpl_001",
      key: "purchase_request",
      name: "采购申请",
      version: 3
    },
    applicant: {
      id: "user_003",
      displayName: "张小北"
    },
    formData: {
      itemName: "MacBook Pro 16",
      quantity: 1,
      budgetAmount: 18999,
      neededBy: "2026-05-20"
    },
    tasks: [],
    actions: [],
    ccRecipients: [],
    submittedAt: "2026-05-04T09:30:00.000Z",
    completedAt: null,
    createdAt: "2026-05-04T09:30:00.000Z",
    updatedAt: "2026-05-04T09:30:00.000Z"
  });
  setJsonSuccessExample(workflowInstanceDetailOperation, "流程实例详情", {
    id: "wf_inst_001",
    title: "采购申请 - MacBook Pro",
    businessKey: "oa-purchase-001",
    status: "IN_PROGRESS",
    currentNodeKey: "manager_approval",
    template: {
      id: "wf_tpl_001",
      key: "purchase_request",
      name: "采购申请",
      version: 3
    },
    applicant: {
      id: "user_003",
      displayName: "张小北"
    },
    formData: {
      itemName: "MacBook Pro 16",
      quantity: 1,
      budgetAmount: 18999
    },
    tasks: [
      {
        id: "wf_task_001",
        nodeKey: "manager_approval",
        nodeName: "直属主管审批",
        isAddSign: false,
        status: "PENDING",
        assignee: {
          id: "user_manager_001",
          displayName: "李主管"
        },
        createdBy: null,
        createdAt: "2026-05-04T09:30:00.000Z",
        decidedAt: null
      }
    ],
    actions: [
      {
        id: "wf_action_001",
        actionType: "SUBMITTED",
        actor: {
          id: "user_003",
          displayName: "张小北"
        },
        comment: null,
        payload: null,
        createdAt: "2026-05-04T09:30:00.000Z"
      }
    ],
    ccRecipients: [],
    submittedAt: "2026-05-04T09:30:00.000Z",
    completedAt: null,
    createdAt: "2026-05-04T09:30:00.000Z",
    updatedAt: "2026-05-04T09:30:00.000Z"
  });
  applyStandardErrorExample(workflowPendingTasksOperation, 403, "/api/workflows/tasks/pending", "当前账号没有流程待办查看权限");
  applyStandardErrorExample(workflowApproveOperation, 403, "/api/workflows/tasks/{taskId}/approve", "当前账号不能处理该流程任务");
  applyStandardErrorExample(workflowApproveOperation, 404, "/api/workflows/tasks/{taskId}/approve", "未找到指定流程任务");
  applyStandardErrorExample(workflowStartByIdOperation, 404, "/api/workflows/templates/{id}/start", "未找到指定流程模板");

  setJsonSuccessExample(notificationListOperation, "通知列表示例", [
    {
      id: "notice_001",
      eventId: "event_customer_created_001",
      domain: "SCRM",
      eventType: "customer.created",
      title: "客户创建成功",
      summary: "上海示例科技有限公司已创建，可继续跟进。",
      priority: "NORMAL",
      status: "UNREAD",
      targetPath: "/customers/cust_001",
      targetLabel: "查看客户详情",
      channelPreferences: {
        inAppEnabled: true,
        emailEnabled: false
      },
      routingSnapshot: {
        resource: "customer",
        resourceId: "cust_001"
      },
      deliveredAt: "2026-05-04T13:00:00.000Z",
      readAt: null,
      createdAt: "2026-05-04T13:00:00.000Z",
      updatedAt: "2026-05-04T13:00:00.000Z",
      deliveries: [
        {
          id: "delivery_001",
          channel: "IN_APP",
          adapterCode: "in-app",
          provider: "platform",
          status: "SENT",
          externalMessageId: null,
          attemptCount: 1,
          errorMessage: null,
          lastAttemptedAt: "2026-05-04T13:00:00.000Z",
          sentAt: "2026-05-04T13:00:00.000Z",
          failedAt: null
        }
      ]
    }
  ]);
  setJsonSuccessExample(notificationReadOperation, "标记已读结果", {
    id: "notice_001",
    eventId: "event_customer_created_001",
    domain: "SCRM",
    eventType: "customer.created",
    title: "客户创建成功",
    summary: "上海示例科技有限公司已创建，可继续跟进。",
    priority: "NORMAL",
    status: "READ",
    targetPath: "/customers/cust_001",
    targetLabel: "查看客户详情",
    channelPreferences: {
      inAppEnabled: true,
      emailEnabled: false
    },
    routingSnapshot: {
      resource: "customer",
      resourceId: "cust_001"
    },
    deliveredAt: "2026-05-04T13:00:00.000Z",
    readAt: "2026-05-04T13:05:00.000Z",
    createdAt: "2026-05-04T13:00:00.000Z",
    updatedAt: "2026-05-04T13:05:00.000Z",
    deliveries: []
  });
  setJsonRequestExample(notificationPreferencesOperation, "保存通知偏好请求", {
    preferences: [
      {
        domain: "SCRM",
        eventType: "customer.created",
        subscribed: true,
        emailEnabled: false,
        enterpriseImEnabled: true,
        digestMode: "IMMEDIATE",
        reminderFrequencyMinutes: 0,
        nudgeThresholdMinutes: 30,
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "08:00"
        }
      }
    ]
  });
  setJsonSuccessExample(notificationPreferencesOperation, "通知偏好保存结果", [
    {
      id: "pref_001",
      domain: "SCRM",
      eventType: "customer.created",
      subscribed: true,
      inAppEnabled: true,
      emailEnabled: false,
      enterpriseImEnabled: true,
      digestMode: "IMMEDIATE",
      reminderFrequencyMinutes: 0,
      nudgeThresholdMinutes: 30,
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "08:00"
      },
      createdAt: "2026-05-04T13:10:00.000Z",
      updatedAt: "2026-05-04T13:10:00.000Z"
    }
  ]);
}
