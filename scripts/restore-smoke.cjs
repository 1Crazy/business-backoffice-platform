const fs = require("fs");
const path = require("path");

function ensureExists(filePath, message) {
  if (!fs.existsSync(filePath)) {
    throw new Error(message);
  }
}

function main() {
  const artifactPath = process.env.BACKUP_ARTIFACT_PATH;

  if (!artifactPath) {
    throw new Error("必须提供 BACKUP_ARTIFACT_PATH。");
  }

  ensureExists(artifactPath, "未找到备份产物文件。");
  ensureExists(`${artifactPath}.manifest.json`, "未找到备份清单文件。");

  const healthUrl = process.env.RESTORE_SMOKE_HEALTH_URL ?? "http://localhost:3000/api/health";
  const checks = [
    {
      name: "health",
      target: healthUrl,
      status: "pending"
    },
    {
      name: "login",
      target: "manual-check",
      status: "pending"
    },
    {
      name: "attachment-download",
      target: "manual-check",
      status: "pending"
    }
  ];

  process.stdout.write(
    JSON.stringify(
      {
        artifactPath,
        checks,
        note: "已生成恢复演练检查骨架，请在目标环境继续执行接口级校验。"
      },
      null,
      2
    )
  );
}

main();
