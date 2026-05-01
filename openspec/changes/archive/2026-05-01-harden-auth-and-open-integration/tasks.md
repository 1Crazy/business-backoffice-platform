## 1. 认证与会话安全

- [x] 1.1 新增后端安全配置校验，拒绝默认或弱 `JWT_SECRET`，并更新 `.env.example` 为不可直接用于运行的占位说明。
- [x] 1.2 为 `AuthService.login`、`refresh` 和 `validateSessionPayload` 补充失败限流、锁定窗口和审计覆盖，避免暴力破解和刷新令牌撞库。
- [x] 1.3 制定 refresh token 存储迁移路径：先收紧 access token TTL 与刷新入口，再实现 `HttpOnly` cookie 方案并验证主应用、OA、SCRM 兼容。
- [x] 1.4 补充认证测试，覆盖弱密钥启动失败、登录失败限流、锁定后拒绝、成功登录清理失败计数、刷新令牌失效。

## 2. 身份连接器与 Open API 加固

- [x] 2.1 重构 `open-integration/connectors/:id/login`，要求请求携带可验证外部证明，禁止裸 `email/username/subject` 直接换取平台会话。
- [x] 2.2 增加连接器级本地 mock 登录开关，仅允许本地/测试环境显式启用，生产环境强制关闭。
- [x] 2.3 为 Open API 凭证校验增加常量时间比较、失败限流、过期/撤销审计和密钥不泄露断言。
- [x] 2.4 补充开放集成测试，覆盖伪造连接器登录被拒、有效断言登录成功、跨租户绑定失败、Open API 凭证失败限流。

## 3. 上传、预览与文档暴露面

- [x] 3.1 为上传增加服务端文件内容校验、文件名规范化和错误信息收敛，禁止只依赖客户端 MIME。
- [x] 3.2 评估并调整 `memoryStorage` 使用方式，确保并发大文件不会造成进程内存不可控增长。
- [x] 3.3 收紧 Swagger 与 CORS：非本地环境默认关闭 `/docs`，CORS origin 必须来自显式允许列表。
- [x] 3.4 补充上传与启动配置测试，覆盖伪装 MIME、禁止预览类型、响应头、安全配置缺失。

## 4. 验证与交付

- [x] 4.1 运行 `pnpm --filter platform-api lint` 和 `pnpm --filter platform-api test`。
- [x] 4.2 针对登录、刷新、连接器登录、Open API 和上传执行最小手动验证，并记录验证账号与结果。
- [x] 4.3 更新 README 或运维文档，记录生产环境必须配置的安全变量、Swagger/CORS 策略和默认账号处理方式。
