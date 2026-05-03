# 运维与生产化检查说明

本文档记录近生产 Docker 拓扑、安全响应头、数据库备份恢复、上传文件一致性和关键环境变量。它用于本仓库的准生产联调，不替代正式云环境 Runbook。

## 近生产 Docker 拓扑

`docker-compose.yml` 当前包含：

- `postgres`：PostgreSQL 16，持久化卷 `postgres-data`
- `api`：NestJS API，挂载上传卷 `uploads-data`
- `main-web`：主应用壳层，默认 `http://localhost:8080`
- `oa-web`：OA 子应用，默认 `http://localhost:8081`
- `scrm-web`：SCRM 子应用，默认 `http://localhost:8082`

主应用构建参数默认指向 `http://localhost:8081` 和 `http://localhost:8082`。如果部署域名不同，必须在构建前覆盖 `VITE_OA_ENTRY` 和 `VITE_SCRM_ENTRY`。

主 compose 不默认把 PostgreSQL 发布到宿主机。需要本地工具直连数据库时，使用开发 override：

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
```

## 安全响应头

三个前端 nginx 配置均设置：

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy`

生产 nginx CSP 不默认开启 `unsafe-eval`。子应用 nginx 额外允许 `http://localhost:8080` 跨源加载静态资源，供 qiankun 宿主使用。生产域名变化时，要同步调整 CSP、`Access-Control-Allow-Origin` 和主应用构建参数；新增脚本来源或重新引入 `unsafe-eval` 前，必须更新 `scripts/architecture-check.cjs` 的登记来源并记录例外原因。

## 数据库备份

建议至少每天执行一次逻辑备份，并在重要迁移前做一次手动备份。仓库内置了可执行脚本：

```bash
pnpm ops:backup
```

脚本会在 `backups/` 下生成备份产物和对应 `.manifest.json`，记录大小、校验和与生成时间。需要保留原始 `docker compose exec pg_dump` 方式时，可继续使用下列命令：

```bash
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-scrm}" \
  -d "${POSTGRES_DB:-scrm}" \
  --format=custom \
  --file=/tmp/business-backoffice.dump

docker compose cp postgres:/tmp/business-backoffice.dump ./backups/business-backoffice-$(date +%Y%m%d%H%M%S).dump
```

生产环境应把备份文件写入独立对象存储或备份系统，不要只保留在数据库容器或同一台宿主机。

## 数据库恢复演练

恢复前必须确认目标库可以被覆盖，并先停止 API，避免恢复过程中继续写入。恢复后可先跑仓库内 smoke 脚手架：

```bash
BACKUP_ARTIFACT_PATH=./backups/xxx.dump pnpm ops:restore-smoke
```

随后再执行恢复命令：

```bash
docker compose stop api
docker compose cp ./backups/business-backoffice.dump postgres:/tmp/business-backoffice.dump
docker compose exec -T postgres pg_restore \
  -U "${POSTGRES_USER:-scrm}" \
  -d "${POSTGRES_DB:-scrm}" \
  --clean \
  --if-exists \
  /tmp/business-backoffice.dump
docker compose start api
```

恢复后至少验证 `/api/health`、登录、租户列表、附件下载和批任务列表。恢复演练结果应记录备份时间、恢复耗时、校验人和异常项。

## 上传文件一致性

数据库中的 `Attachment.storageKey` 必须能在当前存储驱动中找到对应文件。使用本地 Docker 卷时，上传文件保存在 `uploads-data`；切换对象存储驱动时，需要同步校验 bucket、prefix 和 API 返回的 `storageProvider`。

仓库内置了一致性检查脚本：

```bash
ATTACHMENT_DATASET_PATH=/path/to/attachments.json pnpm ops:attachments:check
```

该脚本会输出缺失文件清单，并在发现不一致时返回非零退出码。  
一致性抽查建议：

- 从数据库抽样最近 20 条 `Attachment`，逐条调用下载接口确认返回 200。
- 对失败记录确认是权限问题、文件缺失还是存储配置漂移。
- 数据库恢复后，如果上传卷或对象存储没有按相同时间点恢复，需要把缺失附件标记为不可用或回滚数据库恢复点。

## 关键生产环境变量

- `JWT_SECRET`：至少 32 位随机字符串，禁止使用模板默认值。
- `JWT_ACCESS_TOKEN_TTL`：默认 `30m`，启动期限制不得超过 30 分钟。
- `CORS_ALLOWED_ORIGINS`：生产必须显式配置完整来源列表。
- `RISK_THROTTLE_STORE`：生产必须为 `database`。
- `WEBHOOK_ALLOWED_DOMAINS`：真实 Webhook 测试和投递的目标域名 allowlist，支持 `example.com` 和 `*.example.com`。
- `OPEN_INTEGRATION_SECRET_PEPPER`：Open API 与身份连接器 secret 的 HMAC pepper，生产必须使用独立随机值。
- `OPEN_INTEGRATION_SECRET_ENCRYPTION_KEY`：Webhook signing secret 的应用级加密 key，生产必须使用独立随机值。
- `ATTACHMENT_STORAGE_DRIVER`：`local` 或 `object-storage`；生产推荐对象存储。
- `ATTACHMENT_SCAN_MODE`：`stub`、`disabled` 或后续接入的真实扫描器标识。
- `ATTACHMENT_SCAN_FAIL_CLOSED`：生产建议 `true`；扫描器错误时直接拒绝上传。
- `ATTACHMENT_OBJECT_STORAGE_BUCKET` / `ATTACHMENT_OBJECT_STORAGE_PREFIX`：对象存储桶和前缀。
- `SWAGGER_ENABLED`：生产默认关闭，确需暴露时必须配置 `SWAGGER_BASIC_AUTH_USERNAME` 和 `SWAGGER_BASIC_AUTH_PASSWORD`，并优先配合反向代理 IP 白名单或网络隔离。
- `SWAGGER_BASIC_AUTH_USERNAME` / `SWAGGER_BASIC_AUTH_PASSWORD`：非本地环境开启 Swagger 时必填。
- `ALLOW_MOCK_CONNECTOR_LOGIN`：只允许本地或测试联调使用。
- `PASSWORD_RESET_PUBLIC_BASE_URL`：密码重置邮件落地页的对外基础地址。邮件中的重置链接会拼成 `${PASSWORD_RESET_PUBLIC_BASE_URL}/auth/password-reset?token=...`，必须指向用户真实可访问的前端域名。
- `EMAIL_DELIVERY_PROVIDER`：邮件出站 provider 标识；当前代码默认按 `resend` 风格 HTTP API 调用。
- `EMAIL_RESEND_API_KEY`：邮件 provider API Key。生产必须配置真实值，否则密码重置和邮件通知不会被记为发送成功。
- `EMAIL_RESEND_API_URL`：邮件 provider API 地址；默认 `https://api.resend.com/emails`。
- `EMAIL_FROM_ADDRESS`：系统发件人地址。生产建议使用已验证域名的 `noreply@...` 邮箱。
- `EMAIL_REPLY_TO`：邮件回复地址；建议配置为客服或管理员邮箱。
- `EMAIL_LINK_BASE_URL`：普通邮件通知里相对链接的拼装基础地址。
- `ENTERPRISE_IM_WEBHOOK_URL`：企业 IM 机器人 Webhook 地址。当前用于治理告警等高优通知出站。
- `ENTERPRISE_IM_WEBHOOK_SECRET`：企业 IM Webhook 签名密钥；如果机器人启用了签名校验则必须配置。
- `ENTERPRISE_IM_LINK_BASE_URL`：企业 IM 文案里相对链接的拼装基础地址。

## 认证与出站配置说明

### 密码重置邮件

- 后端不会在接口响应体中回传 `resetToken`。
- 用户提交 `POST /api/auth/password-reset/request` 后，系统会生成一次性 token，并强制通过 `EMAIL` 渠道出站。
- 即使用户在通知偏好里关闭了普通邮件通知，密码重置事件仍然会强制走邮件，不受偏好关闭影响。
- 如果生产环境缺少 `EMAIL_RESEND_API_KEY` 或 `EMAIL_FROM_ADDRESS`，系统不会把密码重置邮件记为成功送达。

### 企业 IM 出站

- 企业 IM 当前按机器人 Webhook 方式集成，适合治理告警和高优先级运营通知。
- 生产环境如果没有配置 `ENTERPRISE_IM_WEBHOOK_URL`，企业 IM 通知不会被记为成功送达。
- 如果机器人启用了签名校验，必须同步配置 `ENTERPRISE_IM_WEBHOOK_SECRET`。

### 推荐检查项

- 确认 `PASSWORD_RESET_PUBLIC_BASE_URL` 指向用户可访问的前端域名，而不是内网或容器地址。
- 确认 `EMAIL_FROM_ADDRESS` 已在邮件 provider 侧完成域名验证。
- 确认 `EMAIL_RESEND_API_KEY`、`ENTERPRISE_IM_WEBHOOK_URL` 等敏感配置已经通过密钥管理系统下发，而不是手工留在宿主机 shell 历史里。
- 近生产联调时至少验证一次“申请密码重置 -> 收到邮件 -> 打开落地页 -> 完成重置 -> 用新密码登录”的完整链路。

## 回滚要点

认证和前端会话改动需要 API 与三端前端一起回滚。若只回滚前端，旧版前端会继续尝试使用 localStorage refresh token，无法兼容 cookie-only refresh。
