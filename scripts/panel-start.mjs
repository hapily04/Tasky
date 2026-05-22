import { spawnSync } from "node:child_process";
import { existsSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "url";
import { applyDatabaseUrl, ensureDataDatabase } from "./ensure-data-db.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { appDir, containerRoot, dataDir, dbFile, databaseUrl } = ensureDataDatabase(__dirname);

const envPath = join(appDir, ".env");
const rootEnv = join(containerRoot, ".env");

process.chdir(appDir);

if (!existsSync(envPath) && existsSync(rootEnv)) {
  try {
    symlinkSync("../.env", ".env", "file");
  } catch {
    /* already linked or unsupported */
  }
}

const env = applyDatabaseUrl(
  {
    ...process.env,
    NPM_CONFIG_CACHE: join(appDir, ".npm"),
    npm_config_cache: join(appDir, ".npm"),
    XDG_CACHE_HOME: join(appDir, ".cache"),
  },
  databaseUrl,
);

console.log(`[tasky] Database: ${dbFile}`);
console.log(`[tasky] Data dir: ${dataDir}`);

function run(command, args, optional = false) {
  console.log(`[tasky] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: appDir,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0 && !optional) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["install"]);
run("npm", ["run", "build"]);
run("npx", ["prisma", "db", "push", "--skip-generate"]);

const start = spawnSync(process.execPath, [join(appDir, "scripts/next-start.mjs")], {
  cwd: appDir,
  env,
  stdio: "inherit",
});

process.exit(start.status ?? 1);
