import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCloudflaredConfig, resolveContainerPaths } from "./container-paths.mjs";
import { ensureDataDatabase } from "./ensure-data-db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { appDir, containerRoot, cloudflaredPath } = resolveContainerPaths(__dirname);
const { databaseUrl, dbFile } = ensureDataDatabase(__dirname);
const nextBin = join(appDir, "node_modules", "next", "dist", "bin", "next");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(containerRoot);
loadEnvConfig(appDir);
process.env.DATABASE_URL = databaseUrl;

const manifestPath = join(appDir, ".next", "routes-manifest.json");

if (!existsSync(manifestPath)) {
  console.error(
    "\n[tasky] No production build found.\n\n" +
      "  Run on the server before starting:\n" +
      "    cd " +
      appDir +
      "\n" +
      "    npm install\n" +
      "    npm run build\n",
  );
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  console.error("\n[tasky] Could not read .next/routes-manifest.json. Run: npm run build\n");
  process.exit(1);
}

if (!Array.isArray(manifest.dataRoutes)) {
  console.error(
    "\n[tasky] Production build is incomplete or outdated.\n\n" +
      "  Remove the .next folder, then rebuild:\n" +
      "    rm -rf .next\n" +
      "    npm run build\n",
  );
  process.exit(1);
}

if (!existsSync(nextBin)) {
  console.error("\n[tasky] Next.js is not installed. Run: npm install\n");
  process.exit(1);
}

const tunnelName = process.env.CLOUDFLARED_TUNNEL ?? "taskytunnel";
const cloudflaredConfig = resolveCloudflaredConfig(containerRoot);

if (existsSync(cloudflaredPath)) {
  const tunnelArgs = ["tunnel"];
  if (cloudflaredConfig) {
    tunnelArgs.push("--config", cloudflaredConfig);
  }
  tunnelArgs.push("run", tunnelName);

  console.log(`[tasky] Cloudflared: ${cloudflaredPath}`);
  console.log(`[tasky] Tunnel cwd: ${containerRoot}`);
  if (cloudflaredConfig) {
    console.log(`[tasky] Tunnel config: ${cloudflaredConfig}`);
  }

  spawn(cloudflaredPath, tunnelArgs, {
    cwd: containerRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      HOME: process.env.HOME ?? containerRoot,
    },
  });
} else {
  console.warn(
    `[tasky] cloudflared not found (looked in ${containerRoot} and ${appDir}) — skipping tunnel`,
  );
}

const bindHost = process.env.BIND_HOST ?? "0.0.0.0";
const port = process.env.SERVER_PORT ?? process.env.PORT ?? "3000";

console.log(`[tasky] App: ${appDir}`);
console.log(`[tasky] Container root: ${containerRoot}`);
console.log(`[tasky] Database: ${dbFile}`);
console.log(`[tasky] Starting on http://${bindHost}:${port}`);

const appCacheEnv = {
  NPM_CONFIG_CACHE: join(appDir, ".npm"),
  npm_config_cache: join(appDir, ".npm"),
  XDG_CACHE_HOME: join(appDir, ".cache"),
  DATABASE_URL: databaseUrl,
};

const child = spawn(process.execPath, [nextBin, "start", "-H", bindHost, "-p", port], {
  stdio: "inherit",
  env: { ...process.env, ...appCacheEnv },
  cwd: appDir,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
