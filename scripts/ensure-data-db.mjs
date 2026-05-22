import { existsSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "url";
import { resolveContainerPaths } from "./container-paths.mjs";

/**
 * Use /data/tasky.db at the container root (or repo root locally).
 * Creates the folder and DB via prisma db push; removes legacy prisma/*.db.
 */
export function ensureDataDatabase(scriptDir = dirname(fileURLToPath(import.meta.url))) {
  const { appDir, containerRoot } = resolveContainerPaths(scriptDir);
  const dataDir = join(containerRoot, "data");
  mkdirSync(dataDir, { recursive: true });

  const dbFile = join(dataDir, "tasky.db");
  const databaseUrl = `file:${dbFile.replace(/\\/g, "/")}`;

  for (const name of ["tasky.db", "tasky.db-journal", "dev.db", "dev.db-journal"]) {
    const legacy = join(appDir, "prisma", name);
    if (existsSync(legacy)) {
      try {
        unlinkSync(legacy);
        console.log(`[tasky] Removed legacy database: ${legacy}`);
      } catch {
        console.warn(`[tasky] Could not remove legacy database: ${legacy}`);
      }
    }
  }

  return { appDir, containerRoot, dataDir, dbFile, databaseUrl };
}

export function applyDatabaseUrl(env, databaseUrl) {
  return { ...env, DATABASE_URL: databaseUrl };
}
