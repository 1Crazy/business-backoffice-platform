const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function existsLocalAttachment(rootDir, storageKey) {
  return fs.existsSync(path.join(rootDir, "uploads", path.basename(storageKey)));
}

function existsObjectAttachment(rootDir, storageKey) {
  const bucket = process.env.ATTACHMENT_OBJECT_STORAGE_BUCKET ?? "attachments";
  const normalized = storageKey
    .split("/")
    .map((segment) => path.basename(segment))
    .filter(Boolean);

  return fs.existsSync(path.join(rootDir, "object-storage", bucket, ...normalized));
}

function main() {
  const datasetPath = process.env.ATTACHMENT_DATASET_PATH;

  if (!datasetPath) {
    throw new Error("必须提供 ATTACHMENT_DATASET_PATH。");
  }

  const dataset = readJson(datasetPath);
  const attachments = Array.isArray(dataset.attachments) ? dataset.attachments : [];
  const repoRoot = process.cwd();
  const missing = [];

  for (const attachment of attachments) {
    const exists =
      attachment.storageProvider === "OBJECT_STORAGE"
        ? existsObjectAttachment(repoRoot, attachment.storageKey)
        : existsLocalAttachment(repoRoot, attachment.storageKey);

    if (!exists) {
      missing.push({
        id: attachment.id,
        storageProvider: attachment.storageProvider,
        storageKey: attachment.storageKey
      });
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        checked: attachments.length,
        missingCount: missing.length,
        missing
      },
      null,
      2
    )
  );

  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

main();
