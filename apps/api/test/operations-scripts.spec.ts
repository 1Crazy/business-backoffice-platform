import { execFileSync } from "child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const repoRoot = join(__dirname, "..", "..", "..");

describe("operations scripts", () => {
  it("writes a backup artifact and manifest", () => {
    const output = execFileSync("node", ["scripts/backup-postgres.cjs"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
        BACKUP_USE_PLACEHOLDER: "true"
      }
    }).toString("utf8");
    const result = JSON.parse(output);

    expect(result.artifactPath).toContain("backups/business-backoffice-");
    expect(result.manifestPath).toContain(".manifest.json");
  });

  it("reports missing attachments from a dataset", () => {
    const sandbox = mkdtempSync(join(tmpdir(), "attachment-consistency-"));
    const datasetPath = join(sandbox, "attachments.json");
    mkdirSync(join(sandbox, "uploads"), { recursive: true });
    writeFileSync(
      datasetPath,
      JSON.stringify({
        attachments: [
          {
            id: "attachment-1",
            storageProvider: "LOCAL",
            storageKey: "missing.pdf"
          }
        ]
      })
    );

    try {
      execFileSync("node", ["scripts/check-attachment-consistency.cjs"], {
        cwd: repoRoot,
        env: {
          ...process.env,
          ATTACHMENT_DATASET_PATH: datasetPath
        }
      });
    } catch (error: any) {
      const output = error.stdout.toString("utf8");
      const result = JSON.parse(output);

      expect(result.missingCount).toBe(1);
      expect(result.missing[0].id).toBe("attachment-1");
      return;
    }

    throw new Error("Consistency script should have reported missing attachments.");
  });

  it("requires backup artifact path for restore smoke", () => {
    expect(() =>
      execFileSync("node", ["scripts/restore-smoke.cjs"], {
        cwd: repoRoot,
        env: {
          ...process.env
        }
      })
    ).toThrow();
  });
});
