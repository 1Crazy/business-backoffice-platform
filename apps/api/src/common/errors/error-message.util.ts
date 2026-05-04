const EXACT_MESSAGE_MAP = new Map<string, string>([
  ["Invalid credentials.", "账号或密码错误。"],
  ["User is unavailable.", "当前账号不可用，请联系管理员。"],
  ["Session is invalid.", "登录状态已失效，请重新登录。"],
  ["Missing active session.", "当前缺少有效会话，请重新登录。"],
  ["Use logout to revoke the current session.", "当前会话请通过退出登录完成下线。"],
  ["Active session was not found.", "目标会话不存在或已失效。"],
  ["Password reset token is invalid.", "密码重置令牌无效或已过期。"],
  ["MFA is not enabled.", "当前账号尚未启用身份验证器。"],
  ["MFA code is invalid.", "身份验证器验证码或恢复码无效。"],
  ["MFA challenge is invalid.", "身份验证器验证流程已失效，请重新登录。"],
  ["MFA enrollment is not prepared.", "身份验证器绑定信息尚未准备完成，请重新发起绑定。"],
  ["MFA challenge did not produce an active session.", "身份验证器验证未能创建有效会话，请重新登录。"],
  ["MFA is not configured.", "当前账号尚未完成身份验证器配置。"],
  ["CSRF token is invalid.", "安全校验失败，请刷新页面后重试。"],
  ["Missing authenticated user.", "当前请求缺少登录身份信息。"],
  ["Insufficient permissions.", "当前账号没有执行该操作的权限。"],
  ["You do not have permission to perform this action.", "当前账号没有执行该操作的权限。"],
  ["You do not have access to this record.", "当前账号无权访问该记录。"],
  ["You do not have access to this customer.", "当前账号无权访问该客户。"],
  ["You do not have access to this opportunity.", "当前账号无权访问该商机。"],
  ["You do not have access to this lead.", "当前账号无权访问该线索。"],
  ["You do not have access to this attachment.", "当前账号无权访问该附件。"],
  ["You do not have access to the linked customer.", "当前账号无权访问关联客户。"],
  ["Tenant context is missing.", "当前请求缺少租户上下文。"],
  ["You do not have access to another tenant's data.", "当前账号无权访问其他租户数据。"],
  ["Too many failed attempts. Please try again later.", "失败次数过多，请稍后再试。"],
  ["Import file is required.", "请先上传导入文件。"],
  ["Only CSV import files are supported.", "当前只支持导入 CSV 文件。"],
  ["Import file must contain a header row and at least one data row.", "导入文件必须包含表头且至少有一行数据。"],
  ["Batch task result file was not found.", "批处理结果文件不存在。"],
  ["Batch task failure file was not found.", "批处理失败明细文件不存在。"],
  ["You do not have permission to read this batch task.", "当前账号没有权限查看该批处理任务。"],
  ["Unsupported attachment business type.", "不支持的附件业务类型。"],
  ["Attachment file is required.", "请先上传附件文件。"],
  ["Attachment exceeds the maximum allowed size.", "附件大小超过系统限制。"],
  ["Attachment type is not supported.", "附件类型不受支持。"],
  ["Attachment content does not match the declared type.", "附件内容与声明的文件类型不一致。"],
  ["Attachment preview is not supported for this file type.", "当前文件类型不支持预览。"],
  ["Attachment is not available until the scan is clean.", "附件尚未通过安全扫描，暂时不可用。"],
  ["Stored attachment content was not found.", "附件存储内容不存在。"],
  ["Notification channel configuration was not found.", "通知通道配置不存在。"],
  ["Attachment preview is disabled for this storage configuration.", "当前存储配置未开启附件预览。"],
  ["Scheduler job is paused and cannot be executed.", "调度任务已暂停，暂时不能执行。"],
  ["Unsupported scheduler job code.", "不支持的调度任务编码。"],
  ["Only active credentials can be rotated.", "只有启用中的凭证才允许轮换。"],
  ["Webhook subscription is disabled.", "当前 Webhook 订阅已禁用。"],
  ["Webhook delivery was not found.", "Webhook 投递记录不存在。"],
  ["Identity connector is disabled.", "身份连接器已禁用。"],
  ["The identity cannot be mapped to a tenant user.", "当前身份无法映射到租户内用户。"],
  ["Missing open API credentials.", "缺少 Open API 凭证。"],
  ["Open API credential is invalid.", "Open API 凭证无效。"],
  ["Open API credential is unavailable.", "Open API 凭证当前不可用。"],
  ["Open API credential scope is insufficient.", "Open API 凭证权限范围不足。"],
  ["Mock connector login is disabled.", "Mock 连接器登录已禁用。"],
  ["Connector login proof is required.", "连接器登录凭证不能为空。"],
  ["Connector login proof is invalid.", "连接器登录凭证无效。"],
  ["The email domain is not allowed for this connector.", "当前邮箱域名不在该连接器允许范围内。"],
  ["At least one valid open API scope is required.", "至少需要选择一个有效的 Open API 权限范围。"],
  ["At least one valid webhook event type is required.", "至少需要选择一个有效的 Webhook 事件类型。"],
  ["Default tenant cannot be modified through lifecycle actions.", "默认租户不允许通过生命周期动作修改。"],
  ["Archived tenant cannot be modified.", "已归档租户不允许继续修改。"],
  ["The opportunity is already in this stage.", "当前商机已经处于该阶段。"],
  ["Closed opportunities can no longer be updated through stage actions.", "已收口商机不能再通过阶段动作更新。"],
  ["This action only supports in-progress stages.", "当前动作只支持进行中阶段。"],
  ["Product configuration entry was not found.", "产品配置项不存在。"],
  ["This lead has already been converted.", "该线索已经完成转化。"],
  ["Cross-tenant tags are not allowed.", "不允许绑定跨租户标签。"],
  ["Password must not match a recently used password.", "新密码不能与最近使用过的密码相同。"]
]);

const REGEX_MESSAGE_MAP: Array<[RegExp, string]> = [
  [/^Background job payload is missing (.+)\.$/, "后台任务缺少必要参数：$1。"],
  [/^Password does not meet the complexity policy: (.+)\.$/, "密码复杂度不符合要求：$1。"],
  [/^You cannot edit restricted field "(.+)"\.$/, "字段“$1”不允许修改。"],
  [/^节点 key (.+) 重复，请调整后重试。$/, "节点 key $1 重复，请调整后重试。"],
  [/^节点顺序 (.+) 重复，请调整后重试。$/, "节点顺序 $1 重复，请调整后重试。"],
  [/^property (.+) should not exist$/, "请求参数中不应包含字段 $1。"],
  [/^(.+) must be a string$/, "$1格式不正确。"],
  [/^(.+) must be longer than or equal to (\d+) characters$/, "$1长度不能少于 $2 个字符。"]
];

const PASSWORD_RULE_MAP: Array<[RegExp, string]> = [
  [/at least (\d+) characters/g, "至少 $1 位"],
  [/an uppercase letter/g, "至少一个大写字母"],
  [/a lowercase letter/g, "至少一个小写字母"],
  [/a number/g, "至少一个数字"],
  [/a symbol/g, "至少一个符号"],
  [/a less predictable password/g, "不能使用过于常见的弱密码"]
];

function translatePasswordPolicy(detail: string): string {
  return PASSWORD_RULE_MAP.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), detail).replaceAll(", ", "，");
}

function translateFieldName(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    username: "账号",
    password: "密码",
    identifier: "账号或邮箱",
    token: "令牌",
    code: "验证码",
    recoveryCode: "恢复码",
    action: "操作类型",
    ticket: "验证票据",
    refreshToken: "刷新令牌"
  };

  return fieldMap[fieldName] ?? fieldName;
}

export function translateErrorMessage(message: string): string {
  const exact = EXACT_MESSAGE_MAP.get(message);
  if (exact) {
    return exact;
  }

  for (const [pattern, template] of REGEX_MESSAGE_MAP) {
    const match = message.match(pattern);
    if (!match) {
      continue;
    }

    if (pattern.source.startsWith("^Password does not meet")) {
      return template.replace("$1", translatePasswordPolicy(match[1] ?? ""));
    }

    if (pattern.source === "^(.+) must be a string$") {
      return template.replace("$1", translateFieldName(match[1] ?? ""));
    }

    if (pattern.source === "^(.+) must be longer than or equal to (\\d+) characters$") {
      return template.replace("$1", translateFieldName(match[1] ?? "")).replace("$2", match[2] ?? "");
    }

    if (pattern.source === "^property (.+) should not exist$") {
      return template.replace("$1", translateFieldName(match[1] ?? ""));
    }

    return template.replace("$1", match[1] ?? "");
  }

  return message;
}

export function translateErrorPayload<T>(payload: T): T {
  if (typeof payload === "string") {
    return translateErrorMessage(payload) as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => translateErrorPayload(item)) as T;
  }

  return payload;
}
