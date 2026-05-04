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
    "WorkflowPendingTaskVo.businessKey": "流程绑定的业务单据主键或外部业务键，便于与业务系统单据对照。"
  }
};
