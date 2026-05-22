import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDataDatabase } from "./ensure-data-db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { appDir, containerRoot, databaseUrl } = ensureDataDatabase(__dirname);
const nextBin = join(appDir, "node_modules", "next", "dist", "bin", "next");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(containerRoot);
loadEnvConfig(appDir);
process.env.DATABASE_URL = databaseUrl;

if (!existsSync(nextBin)) {
  console.error("\n[tasky] Next.js is not installed. Run: npm install\n");
  process.exit(1);
}

const bindHost = process.env.BIND_HOST ?? "0.0.0.0";
const port = process.env.SERVER_PORT ?? process.env.PORT ?? "3000";

console.log(`[tasky] Dev server on http://${bindHost}:${port}`);

const child = spawn(
  process.execPath,
  [nextBin, "dev", "--turbopack", "-H", bindHost, "-p", port],
  { stdio: "inherit", env: process.env, cwd: appDir },
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
