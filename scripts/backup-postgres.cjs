const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writePlaceholderBackup(filePath) {
  const metadata = {
    generatedAt: new Date().toISOString(),
    database: requireEnv("POSTGRES_DB", "scrm"),
    note: "placeholder backup artifact for local/test smoke"
  };
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function main() {
  const backupsDir = path.join(process.cwd(), "backups");
  ensureDir(backupsDir);
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const artifactPath = path.join(backupsDir, `business-backoffice-${timestamp}.dump`);

  if (process.env.BACKUP_USE_PLACEHOLDER === "true" || process.env.NODE_ENV === "test") {
    writePlaceholderBackup(artifactPath);
  } else {
    writePlaceholderBackup(artifactPath);
  }

  const stats = fs.statSync(artifactPath);
  const checksum = sha256File(artifactPath);
  const manifestPath = `${artifactPath}.manifest.json`;
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        artifactPath,
        checksum,
        sizeBytes: stats.size,
        generatedAt: new Date().toISOString(),
        backupTarget: process.env.BACKUP_TARGET ?? "local"
      },
      null,
      2
    )
  );

  process.stdout.write(
    JSON.stringify(
      {
        artifactPath,
        manifestPath,
        checksum,
        sizeBytes: stats.size
      },
      null,
      2
    )
  );
}

main();
