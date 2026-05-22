# Run Tasky on Pterodactyl

Your repo does **not** need to be public. This guide explains **Install** vs **Reinstall** — that is what confuses most people.

## What “Install” means on Pterodactyl

You are **not** skipping Pterodactyl’s installer. The **Tasky egg has its own install script** — that is what runs when you click **Install** (or when the panel auto-runs install after you create the server).

There is no separate “default installation” to turn off. You only choose **how** the egg gets your code:

| **USER_UPLOAD** | What Install does |
|-----------------|-------------------|
| `1` (SFTP) | If files are not uploaded yet → exits successfully and tells you to upload, then **Reinstall** |
| `1` (SFTP) | If `package.json` is already there → `npm install`, `npm run build`, database setup |
| `0` (git) | Clones your repo (private OK with **GIT_TOKEN**), then build |

---

## SFTP checklist (private code, recommended)

Do these in order:

1. **Admin:** import [`pterodactyl/egg-tasky.json`](../pterodactyl/egg-tasky.json) into a nest.
2. **Create server** with egg **Tasky**, image **Node.js 22**, pick a port.
3. **Startup tab:** set **USER_UPLOAD** = `1`, **AUTH_SECRET**, **AUTH_URL**, Discord keys, etc.  
   **AUTH_URL** = `http://YOUR_IP:YOUR_PORT` (same port Pterodactyl assigned).
4. Let the first **Install** finish (often runs automatically when the server is created).  
   Console may say *“upload via SFTP, then Reinstall”* — **that is expected.**
5. **SFTP** (or file manager): upload into **`/home/container`** so **`package.json` is at the root** (not inside a subfolder).  
   Include `src/`, `prisma/`, `scripts/`, `next.config.ts`, …  
   **Do not** upload `node_modules`, `.next`, or `.env` (use panel variables instead).  
   Reinstall reads the same files from `/mnt/server` inside the install container — that is normal.
6. Click **Reinstall** and wait several minutes. Console should show `Installing in /mnt/server` and then npm/build output.
7. Click **Start** → open **AUTH_URL** in your browser.

You only click **Install** once at the beginning (or it runs for you). After uploading files, you use **Reinstall**, not Install again from scratch.

### If your panel offers “Skip install script” when creating the server

That is optional. Either way works:

- **Leave install enabled (default):** first install succeeds quickly → upload → **Reinstall**.
- **Skip install on create:** upload files first → click **Install** once → **Start**.

---

## Private git checklist (no SFTP)

1. Create server, set **USER_UPLOAD** = `0`.
2. Set **GIT_ADDRESS**, **GIT_TOKEN**, **GIT_USERNAME** (`x-access-token` on GitHub).
3. Click **Install** (or let it run on create) — clone + build happen in one step.
4. **Start**.

GitHub token: [Personal Access Token](https://github.com/settings/tokens) with **read** access to the repo.

---

## Variables (Startup tab)

| Variable | SFTP | Git |
|----------|------|-----|
| USER_UPLOAD | `1` | `0` |
| AUTH_SECRET | required | required |
| AUTH_URL | required | required |
| AUTH_DISCORD_ID / AUTH_DISCORD_SECRET | required | required |
| GIT_ADDRESS | leave empty | repo URL |
| GIT_TOKEN | leave empty | PAT for private repo |
| GIT_USERNAME | — | `x-access-token` (GitHub) |

## Discord redirect

```text
http://YOUR_IP:YOUR_PORT/api/auth/callback/discord
```

Must match **AUTH_URL** exactly.

## Updating later

Upload changed files via SFTP, then in **Console**:

```bash
npm install && npm run build && npx prisma db push --skip-generate
```

Restart. Or **Reinstall** from the panel.

For git: `git pull` then the same commands, or **Reinstall**.

## Troubleshooting

| Situation | What to do |
|-----------|------------|
| Install failed, no files yet | Normal on first create with SFTP — upload files, then **Reinstall** |
| Reinstall still says “no files” after SFTP | `package.json` must be at **`/home/container/package.json`**, not in a subfolder; re-import the latest egg |
| Reinstall shows `Installing in /mnt/server` | Correct — same folder as SFTP’s `/home/container` |
| “Install” but app won’t start | You probably need **Reinstall** after upload (build creates `.next`) |
| Git auth failed | Check **GIT_TOKEN** and **GIT_USERNAME** |
| Wrong URL in browser | Fix **AUTH_URL** to match IP + allocation port |

## Egg files

- Import: [`pterodactyl/egg-tasky.json`](../pterodactyl/egg-tasky.json)
- Install script source: [`pterodactyl/install.sh`](../pterodactyl/install.sh) (re-import egg after editing)
