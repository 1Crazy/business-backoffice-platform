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

## 安全响应头

三个前端 nginx 配置均设置：

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy`

子应用 nginx 额外允许 `http://localhost:8080` 跨源加载静态资源，供 qiankun 宿主使用。生产域名变化时，要同步调整 CSP、`Access-Control-Allow-Origin` 和主应用构建参数。

## 数据库备份

建议至少每天执行一次逻辑备份，并在重要迁移前做一次手动备份：

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

恢复前必须确认目标库可以被覆盖，并先停止 API，避免恢复过程中继续写入：

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
- `ATTACHMENT_STORAGE_DRIVER`：`local` 或 `object-storage`；生产推荐对象存储。
- `ATTACHMENT_OBJECT_STORAGE_BUCKET` / `ATTACHMENT_OBJECT_STORAGE_PREFIX`：对象存储桶和前缀。
- `SWAGGER_ENABLED`：生产默认关闭，确需暴露时必须经过访问控制或网络隔离。
- `ALLOW_MOCK_CONNECTOR_LOGIN`：只允许本地或测试联调使用。

## 回滚要点

认证和前端会话改动需要 API 与三端前端一起回滚。若只回滚前端，旧版前端会继续尝试使用 localStorage refresh token，无法兼容 cookie-only refresh。
