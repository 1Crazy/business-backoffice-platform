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
    throw new Error("BACKUP_ARTIFACT_PATH is required.");
  }

  ensureExists(artifactPath, "Backup artifact was not found.");
  ensureExists(`${artifactPath}.manifest.json`, "Backup manifest was not found.");

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
        note: "restore smoke scaffold created; run endpoint-specific checks in environment"
      },
      null,
      2
    )
  );
}

main();
