import type { SchemaDescriptionModule } from "../shared/schema-descriptions";

export const OA_SCHEMA_DESCRIPTIONS: SchemaDescriptionModule = {
  propertyDescriptions: {
    "NotificationRecordVo.id": "站内通知记录 ID，用于消息读取、归档和跳转追踪。",
    "NotificationRecordVo.eventId": "触发该通知的归一化事件 ID；同一业务事件的多渠道投递可据此关联。",
    "NotificationPreferenceVo.id": "通知偏好配置 ID，用于标识当前用户在指定通知场景下的订阅策略。",
    "NotificationDeliveryVo.id": "单次通知渠道投递记录 ID，用于排查发送结果、重试链路和回执状态。",
    "NotificationDeliveryVo.adapterCode": "执行本次通知投递的渠道适配器编码，用于区分站内信、邮件、企业 IM 等实现。",
    "NotificationDeliveryVo.externalMessageId": "第三方渠道返回的消息回执 ID，用于外部平台追踪、对账或补偿。",
    "WorkflowPendingTaskVo.id": "当前待处理流程任务 ID，用于审批办理、转办、加签等操作定位。",
    "WorkflowPendingTaskVo.instanceId": "该待办所属流程实例 ID，用于查看整条审批流的上下文。",
    "WorkflowPendingTaskVo.nodeKey": "当前待办所在流程节点编码，用于标识具体审批环节。",
    "WorkflowPendingTaskVo.businessKey": "流程绑定的业务单据主键或外部业务键，便于与业务系统单据对照。",
    "PendingApprovalItemVo.status":
      "待审批事项当前状态。PENDING=待审批；APPROVED=已批准；REJECTED=已驳回；CANCELLED=已取消。",
    "WorkfeedTodoVo.domain": "待办所属业务域。oa=办公协同待办；scrm=销售客户域待办。",
    "WorkfeedTodoVo.type":
      "待办类型。LEAVE_APPROVAL=请假审批；ADMINISTRATIVE_APPROVAL=行政审批；CUSTOMER_REMINDER=客户跟进提醒；LEAD_REMINDER=线索跟进提醒；RENEWAL_REMINDER=续费提醒。",
    "WorkfeedTodoVo.priority": "待办优先级。HIGH=高优先级；MEDIUM=中优先级；LOW=低优先级。",
    "WorkfeedNotificationVo.domain": "通知所属业务域。oa=办公协同通知；scrm=销售客户域通知。",
    "WorkfeedNotificationVo.type":
      "通知类型。LEAVE_RESULT=请假审批结果；ADMINISTRATIVE_RESULT=行政审批结果；CUSTOMER_REMINDER=客户跟进提醒；LEAD_REMINDER=线索跟进提醒；RENEWAL_REMINDER=续费提醒；ANNOUNCEMENT=公告通知。",
    "WorkfeedNotificationVo.priority": "通知优先级。HIGH=高优先级；MEDIUM=中优先级；LOW=低优先级。",
    "ListWorkfeedTodosDto.domain": "按业务域筛选待办。oa=办公协同；scrm=销售客户域。",
    "ListWorkfeedTodosDto.type":
      "按待办类型筛选。LEAVE_APPROVAL=请假审批；ADMINISTRATIVE_APPROVAL=行政审批；CUSTOMER_REMINDER=客户跟进提醒；LEAD_REMINDER=线索跟进提醒；RENEWAL_REMINDER=续费提醒。",
    "ListWorkfeedTodosDto.priority": "按优先级筛选。HIGH=高优先级；MEDIUM=中优先级；LOW=低优先级。",
    "ListWorkfeedNotificationsDto.domain": "按业务域筛选通知。oa=办公协同；scrm=销售客户域。",
    "ListWorkfeedNotificationsDto.type":
      "按通知类型筛选。LEAVE_RESULT=请假审批结果；ADMINISTRATIVE_RESULT=行政审批结果；CUSTOMER_REMINDER=客户跟进提醒；LEAD_REMINDER=线索跟进提醒；RENEWAL_REMINDER=续费提醒；ANNOUNCEMENT=公告通知。",
    "MarkWorkfeedNotificationReadDto.notificationType":
      "待标记已读的通知类型。LEAVE_RESULT=请假审批结果；ADMINISTRATIVE_RESULT=行政审批结果；CUSTOMER_REMINDER=客户跟进提醒；LEAD_REMINDER=线索跟进提醒；RENEWAL_REMINDER=续费提醒；ANNOUNCEMENT=公告通知。"
  },
  enumDescriptions: {
    NotificationChannel: {
      IN_APP: "站内消息渠道，在系统内消息中心查看。",
      EMAIL: "邮件渠道，通过邮箱发送通知。",
      ENTERPRISE_IM: "企业即时通讯渠道，如企业微信、钉钉等。"
    },
    NotificationDomain: {
      OA: "办公协同域通知。",
      SCRM: "销售客户域通知。",
      PLATFORM: "平台治理或管理域通知。",
      SYSTEM: "系统级通知。"
    },
    NotificationPriority: {
      LOW: "低优先级，通常用于普通提醒。",
      MEDIUM: "中优先级，属于常规业务通知。",
      HIGH: "高优先级，需要尽快关注处理。",
      CRITICAL: "最高优先级，通常表示严重异常或强提醒事件。"
    },
    NotificationRecordStatus: {
      UNREAD: "通知未读。",
      READ: "通知已读。",
      ARCHIVED: "通知已归档，通常不再在默认列表中突出展示。"
    },
    NotificationDeliveryStatus: {
      PENDING: "通知已进入投递流程，等待发送。",
      SENT: "通知已成功发送到对应渠道。",
      FAILED: "通知发送失败。",
      SKIPPED: "通知本次被跳过发送，例如命中静默、偏好关闭或路由策略。"
    },
    NotificationDigestMode: {
      IMMEDIATE: "事件触发后立即发送。",
      HOURLY: "按小时汇总后发送。",
      DAILY: "按天汇总后发送。",
      WEEKLY: "按周汇总后发送。"
    },
    LeaveRequestStatus: {
      PENDING: "请假申请待审批。",
      APPROVED: "请假申请已批准。",
      REJECTED: "请假申请已驳回。",
      CANCELLED: "请假申请已取消。"
    },
    AdministrativeRequestType: {
      REIMBURSEMENT: "报销申请。",
      TRAVEL: "出差申请。",
      PURCHASE: "采购申请。",
      SEAL: "用印申请。"
    },
    AdministrativeRequestStatus: {
      PENDING: "行政申请待审批。",
      APPROVED: "行政申请已批准。",
      REJECTED: "行政申请已驳回。",
      CANCELLED: "行政申请已取消。"
    },
    AdministrativeRequestActionType: {
      SUBMITTED: "已提交申请。",
      APPROVED: "审批已通过。",
      REJECTED: "审批已驳回。",
      CANCELLED: "申请已取消。"
    },
    ApprovalActionDecision: {
      APPROVED: "本次审批决定为通过。",
      REJECTED: "本次审批决定为驳回。"
    },
    WorkflowTemplateStatus: {
      DRAFT: "模板为草稿，仍可继续编辑。",
      ACTIVE: "模板已启用，可用于发起流程。",
      DISABLED: "模板已停用，不能再发起新流程。"
    },
    WorkflowNodeType: {
      APPROVAL: "审批节点，需要审批人处理。",
      NOTICE: "通知节点，仅做通知或抄送，不阻塞流程。"
    },
    WorkflowAssignmentType: {
      USER: "指定具体员工为处理人。",
      PERMISSION: "按权限规则动态匹配处理人。",
      INITIATOR: "由流程发起人自己处理或关联。"
    },
    WorkflowInstanceStatus: {
      IN_PROGRESS: "流程进行中。",
      APPROVED: "流程已审批通过。",
      REJECTED: "流程已被驳回结束。",
      CANCELLED: "流程由发起方或业务侧取消。",
      TERMINATED: "流程被管理员或系统强制终止。"
    },
    WorkflowTaskStatus: {
      PENDING: "任务待处理。",
      APPROVED: "任务已审批通过。",
      REJECTED: "任务已驳回。",
      TRANSFERRED: "任务已转交给其他处理人。",
      CANCELLED: "任务已取消，不再需要处理。"
    },
    WorkflowActionType: {
      SUBMITTED: "发起并提交流程。",
      APPROVED: "审批通过。",
      REJECTED: "审批驳回。",
      CC: "新增抄送。",
      ADDED_SIGN: "执行了加签操作。",
      TRANSFERRED: "任务已转交。",
      CANCELLED: "流程已取消。",
      TERMINATED: "流程被终止。"
    }
  }
};
