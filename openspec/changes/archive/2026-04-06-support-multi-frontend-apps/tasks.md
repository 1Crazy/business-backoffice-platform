## 1. Workspace Rename And Frontend Naming

- [x] 1.1 将现有前端目录从 `apps/web` 重命名为 `apps/scrm-web`，并同步修正该工作区内部的构建、开发和部署相关路径引用。
- [x] 1.2 将前端工作区包名从 `@scrm/web` 调整为 `scrm-web`，并更新根脚本、工作区过滤命令及锁文件中的对应引用。
- [x] 1.3 将根级前端脚本改为显式应用命名，例如 `dev:scrm-web`，并明确 `dev:full` 默认联调组合指向 `apps/api + apps/scrm-web`。

## 2. Engineering Entrypoints And Guards

- [x] 2.1 更新 `docker-compose.yml`、前端 Dockerfile 相关路径和服务命名，移除对单一 `apps/web` 与模糊 `web` 服务名的依赖。
- [x] 2.2 更新 CI 工作流和任何仓库级自动化入口，使其识别 `apps/scrm-web` 与新的前端工作区包名。
- [x] 2.3 泛化 `scripts/architecture-check.cjs` 中的前端扫描逻辑和报错文案，使其针对所有 `apps/*-web` 工作区执行相同守卫。

## 3. Documentation And Spec Alignment

- [x] 3.1 更新 `openspec/specs/codebase-architecture/spec.md`、`README.md` 和 `docs/development.md` 中对前端目录、脚本和命名的描述，消除对唯一 `apps/web` 的硬编码表述。
- [x] 3.2 检查并修正文档、示例命令、环境变量说明和开发路径，使其与 `scrm-web` 命名和未来 `oa-web` 扩展方式保持一致。

## 4. Verification

- [x] 4.1 验证重命名后的根脚本、前端工作区脚本、Docker 构建路径和架构校验目标都能正确解析。
- [x] 4.2 运行与本次变更相关的仓库级校验，至少覆盖类型检查、测试、构建或其他受工作区重命名影响的关键命令。
