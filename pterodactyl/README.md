# Pterodactyl layout



Keep **persistent** files at the container root. Replace only **`app/`** on each deploy.



```

/home/container/

├── .env                 ← keep (secrets, DATABASE_URL)

├── cloudflared          ← keep (tunnel binary)

├── .cloudflared/        ← keep (tunnel config)

├── data/

│   └── tasky.db         ← keep (SQLite database)

└── app/                 ← replace on every upload (zip extracts here)

    ├── package.json

    ├── prisma/

    │   └── schema.prisma

    ├── src/

    ├── scripts/

    ├── .next/           ← built on server (or prebuilt in zip)

    ├── .npm/            ← npm cache (safe to delete with app/)

    └── .cache/          ← Next/Prisma cache (safe to delete with app/)

```



Do **not** keep `.npm` or `.cache` at the container root — those appear when npm runs with `HOME=/home/container`. The startup script below puts them inside `app/` instead.



## First-time setup



1. **Database** — startup scripts create `/home/container/data/`, use `data/tasky.db`, and remove old `app/prisma/*.db` files. `prisma db push` creates the schema if the DB is missing.

2. **`/home/container/.env`** — other secrets only; `DATABASE_URL` is set automatically, but you may add:

   ```env
   DATABASE_URL="file:/home/container/data/tasky.db"
   ```

3. Put **`cloudflared`** and **`.cloudflared/`** at the container root (not inside `app/`).



4. Remove stray root caches if they already exist:



   ```bash

   rm -rf /home/container/.npm /home/container/.cache

   ```



## Deploy (each update)



1. Run `pack-for-upload.bat` on your PC and upload the zip.

2. Delete **`/home/container/app`** only.

3. Extract the zip → `/home/container/app/...`

4. Keep **`.env`**, **`data/`**, **`cloudflared`**, **`.cloudflared/`**

5. Restart the server.



## Startup command

**Recommended** (works even if the zip was built on Windows):

```bash
node /home/container/app/scripts/panel-start.mjs
```

Shell alternative:

```bash
sh /home/container/app/scripts/panel-start.sh
```

If you see `set: Illegal option -`, the `.sh` file has CRLF line endings — use the `node` command above.

One-liner:

```bash
cd /home/container/app && ln -sf ../.env .env 2>/dev/null && export NPM_CONFIG_CACHE="$PWD/.npm" XDG_CACHE_HOME="$PWD/.cache" && npm install && npm run build && npx prisma db push --skip-generate 2>/dev/null; node /home/container/app/scripts/next-start.mjs
```



## Faster deploys (optional)



Prebuild with `INCLUDE_NEXT=1` in `pack-for-upload.bat`, then:



```bash

cd /home/container/app && ln -sf ../.env .env 2>/dev/null && export NPM_CONFIG_CACHE="$PWD/.npm" XDG_CACHE_HOME="$PWD/.cache" && npm ci --omit=dev && npx prisma generate && npx prisma db push --skip-generate 2>/dev/null; node /home/container/app/scripts/next-start.mjs

```


