import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "url";

/**
 * Server (Pterodactyl): app code in `app/`, persistent files one level up.
 * Local dev: repo root is the app; `data/` sits beside `prisma/`.
 */
export function resolveContainerPaths(scriptDir = dirname(fileURLToPath(import.meta.url))) {
  const appDir = join(scriptDir, "..");
  const parentDir = join(appDir, "..");

  if (process.env.CONTAINER_ROOT) {
    const containerRoot = process.env.CONTAINER_ROOT;
    return {
      appDir,
      containerRoot,
      cloudflaredPath: resolveCloudflaredBinary(containerRoot),
    };
  }

  const cloudflaredInParent = existsSync(join(parentDir, "cloudflared"));
  const parentHasData = existsSync(join(parentDir, "data"));
  const parentHasEnv =
    existsSync(join(parentDir, ".env")) && !existsSync(join(appDir, ".env"));
  const appFolderLayout = basename(appDir) === "app";

  const useParent =
    cloudflaredInParent || parentHasData || parentHasEnv || appFolderLayout;

  const containerRoot = useParent ? parentDir : appDir;

  return {
    appDir,
    containerRoot,
    cloudflaredPath: resolveCloudflaredBinary(containerRoot, appDir),
  };
}

function resolveCloudflaredBinary(containerRoot, appDir) {
  if (process.env.CLOUDFLARED_PATH) {
    return process.env.CLOUDFLARED_PATH;
  }

  const candidates = [
    join(containerRoot, "cloudflared"),
    join(appDir, "cloudflared"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return join(containerRoot, "cloudflared");
}

export function resolveCloudflaredConfig(containerRoot) {
  if (process.env.CLOUDFLARED_CONFIG) {
    return process.env.CLOUDFLARED_CONFIG;
  }

  const candidates = [
    join(containerRoot, ".cloudflared", "config.yml"),
    join(containerRoot, ".cloudflared", "config.yaml"),
    join(containerRoot, "config.yml"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}
