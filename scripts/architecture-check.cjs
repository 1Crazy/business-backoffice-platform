const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const baselinePath = path.join(repoRoot, "scripts", "architecture-check-baseline.json");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const failures = [];
const warnings = [];

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function relativePath(filePath) {
  return toPosixPath(path.relative(repoRoot, filePath));
}

function walkFiles(startDir, matcher) {
  if (!fs.existsSync(startDir)) {
    return [];
  }

  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, matcher));
      continue;
    }

    if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function addFailure(rule, file, message) {
  failures.push({
    rule,
    file,
    message
  });
}

function addWarning(message) {
  warnings.push(message);
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function isAllowlisted(ruleName, file) {
  return baseline[ruleName]?.allow?.includes(file);
}

function checkStaleAllowlist(ruleName) {
  const allowlist = baseline[ruleName]?.allow ?? [];

  for (const entry of allowlist) {
    // 基线例外应该随着重构逐步收缩；文件已删除时提醒清理，避免白名单越积越多。
    if (!fs.existsSync(path.join(repoRoot, entry))) {
      addWarning(`[${ruleName}] baseline entry no longer exists: ${entry}`);
    }
  }
}

function checkVueLineLimit() {
  // 这里故意只检查 `.vue` 文件，因为当前规则是针对页面/组件体量，而不是普通工具模块。
  const limit = baseline.maxVueLines.limit;
  const files = walkFiles(path.join(repoRoot, "apps", "web", "src"), (filePath) => filePath.endsWith(".vue"));

  for (const filePath of files) {
    const file = relativePath(filePath);
    const lineCount = readFile(filePath).split(/\r?\n/).length;

    if (lineCount <= limit || isAllowlisted("maxVueLines", file)) {
      continue;
    }

    addFailure("maxVueLines", file, `Vue file has ${lineCount} lines, exceeding limit ${limit}.`);
  }
}

function checkPresentationHttpImports() {
  // 页面、布局和展示组件都属于“展示层”；它们可以调用领域 API 或 composable，但不能直接触底层 HTTP 客户端。
  const roots = [
    path.join(repoRoot, "apps", "web", "src", "pages"),
    path.join(repoRoot, "apps", "web", "src", "layout"),
    path.join(repoRoot, "apps", "web", "src", "components")
  ];
  const importPattern = /from\s+["'][^"']*api\/http["']|from\s+["']axios["']/;

  for (const root of roots) {
    const files = walkFiles(root, (filePath) => filePath.endsWith(".vue") || filePath.endsWith(".ts"));

    for (const filePath of files) {
      const file = relativePath(filePath);
      const content = readFile(filePath);

      if (!importPattern.test(content) || isAllowlisted("presentationHttpImports", file)) {
        continue;
      }

      addFailure(
        "presentationHttpImports",
        file,
        "Presentation-layer file imports api/http or axios directly. Move requests into apps/web/src/api or composables."
      );
    }
  }
}

function checkBackendDeepRelativeImports() {
  // 后端允许同目录和单层近邻相对路径，但跨层依赖统一收敛到 `@/`，避免继续累积 `../../` 噪音。
  const files = walkFiles(path.join(repoRoot, "apps", "api", "src"), (filePath) => filePath.endsWith(".ts"));
  const importPattern = /from\s+["'](\.\.\/){2,}[^"']+["']/;

  for (const filePath of files) {
    const file = relativePath(filePath);
    const content = readFile(filePath);

    if (!importPattern.test(content)) {
      continue;
    }

    addFailure(
      "backendDeepRelativeImports",
      file,
      "Backend source file uses a multi-level relative import. Use @/ alias for cross-directory imports inside apps/api/src."
    );
  }
}

function checkControllerOrmAccess() {
  // controller 允许引用 Prisma 的枚举类型，但不允许直接持有或调用 ORM 客户端。
  const files = walkFiles(path.join(repoRoot, "apps", "api", "src"), (filePath) => filePath.endsWith("controller.ts"));
  const ormPattern = /\bPrismaService\b|new\s+PrismaClient\b|this\.prisma\b|(^|[^A-Za-z0-9_])prisma\./m;

  for (const filePath of files) {
    const file = relativePath(filePath);
    const content = readFile(filePath);

    if (!ormPattern.test(content)) {
      continue;
    }

    addFailure("controllerOrmAccess", file, "Controller accesses ORM details directly. Keep ORM usage out of controllers.");
  }
}

function isRepositoryFile(file) {
  return file.includes("/repository/") || file.includes("/repositories/");
}

function isSharedPrismaInfrastructure(file) {
  return file.startsWith("apps/api/src/common/prisma/");
}

function checkPrismaUsagePlacement() {
  // 当前仓库还存在一批遗留 service 直接使用 Prisma；脚本通过基线白名单兜底，
  // 让我们能先启用护栏，再逐步把这些例外迁回 repository 层。
  const files = walkFiles(path.join(repoRoot, "apps", "api", "src"), (filePath) => filePath.endsWith(".ts"));
  const prismaPattern = /\bPrismaService\b|this\.prisma\b|new\s+PrismaClient\b|\$transaction/;

  for (const filePath of files) {
    const file = relativePath(filePath);
    const content = readFile(filePath);

    if (!prismaPattern.test(content)) {
      continue;
    }

    if (isRepositoryFile(file) || isSharedPrismaInfrastructure(file) || isAllowlisted("prismaOutsideRepository", file)) {
      continue;
    }

    addFailure(
      "prismaUsagePlacement",
      file,
      "Prisma usage must live in repository files unless the path is a documented legacy exception."
    );
  }
}

function printResults() {
  if (!failures.length) {
    console.log("architecture:check passed");
  } else {
    console.error("architecture:check failed");

    for (const failure of failures) {
      console.error(`- [${failure.rule}] ${failure.file}: ${failure.message}`);
    }
  }

  if (warnings.length) {
    console.warn("architecture:check warnings");

    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (failures.length) {
    console.error("Update scripts/architecture-check-baseline.json only for reviewed legacy exceptions.");
    process.exit(1);
  }
}

checkStaleAllowlist("maxVueLines");
checkStaleAllowlist("presentationHttpImports");
checkStaleAllowlist("prismaOutsideRepository");

checkVueLineLimit();
checkPresentationHttpImports();
checkBackendDeepRelativeImports();
checkControllerOrmAccess();
checkPrismaUsagePlacement();
printResults();
