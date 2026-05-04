const net = require("net");
const fs = require("fs");
const path = require("path");

function readDatabaseUrl() {
  const envFiles = [
    path.join(process.cwd(), "apps/api/.env.local"),
    path.join(process.cwd(), "apps/api/.env"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env")
  ];

  for (const filePath of envFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!line.startsWith("DATABASE_URL=")) {
        continue;
      }

      return line.slice("DATABASE_URL=".length).trim();
    }
  }

  return process.env.DATABASE_URL || null;
}

function parseTarget(databaseUrl) {
  if (!databaseUrl) {
    return null;
  }

  try {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || "5432"),
      database: parsed.pathname.replace(/^\//, "") || "(unknown-db)"
    };
  } catch {
    return null;
  }
}

function checkPort(target) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(
      {
        host: target.host,
        port: target.port,
        timeout: 1200
      },
      () => {
        socket.end();
        resolve();
      }
    );

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });

    socket.on("error", (error) => {
      socket.destroy();
      reject(error);
    });
  });
}

async function main() {
  const databaseUrl = readDatabaseUrl();
  const target = parseTarget(databaseUrl);

  if (!target) {
    console.error("未能解析 DATABASE_URL，跳过数据库预检查。");
    process.exit(0);
  }

  try {
    await checkPort(target);
  } catch (error) {
    console.error(`数据库未连通：${target.host}:${target.port}/${target.database}`);
    console.error("API 将无法成功启动，因此 /docs、/docs/debug 和 /docs-json 也不可用。");
    console.error("如果数据库运行在 Docker，请先执行：pnpm docker:infra");
    process.exit(1);
  }
}

main();
