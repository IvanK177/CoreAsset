# CoreAsset Dev Startup Fix Plan

## Problem
`npm run dev` does not work — project needs initial setup from scratch.

## Root Cause Analysis

After reviewing the entire project, I identified **6 issues** that prevent the dev server from starting:

### Issue 1: Wrong Package Manager
The project is configured for **pnpm** (has `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `"packageManager": "pnpm@10.11.0"`), but there's also a stale `package-lock.json` from npm. Using `npm run dev` with a pnpm monorepo causes dependency resolution failures.

**Fix:** Delete `package-lock.json` and use `pnpm` commands instead.

### Issue 2: Missing `.env` File
The `.env` file is gitignored and doesn't exist. Both Prisma and the Next.js frontend require environment variables to function.

**Fix:** Create `.env` from `.env.example` with actual database credentials.

### Issue 3: Missing `DIRECT_URL` in Prisma Config
The Prisma schema at [`schema.prisma`](packages/database/prisma/schema.prisma:12) declares:
```
directUrl = env("DIRECT_URL")
```
But `.env.example` only has `DATABASE_URL` — no `DIRECT_URL`. This will cause Prisma to crash on startup.

**Fix:** Add `DIRECT_URL` to both `.env.example` and the new `.env` file. For Supabase, `DIRECT_URL` is typically the same connection string but with a different pooler mode (session mode vs transaction mode).

### Issue 4: Windows-Incompatible `rm -rf` Commands
All `clean` scripts use `rm -rf` which doesn't work on Windows cmd.exe:
- [`apps/api/package.json`](apps/api/package.json:12): `"clean": "rm -rf dist node_modules"`
- [`apps/web/package.json`](apps/web/package.json:10): `"clean": "rm -rf .next node_modules"`
- [`packages/database/package.json`](packages/database/package.json:16): `"clean": "rm -rf node_modules"`
- [`packages/ui/package.json`](packages/ui/package.json:10): `"clean": "rm -rf node_modules"`

**Fix:** Replace `rm -rf` with cross-platform alternatives. Options:
- Use `rimraf` npm package (add as devDependency)
- Use PowerShell `Remove-Item -Recurse -Force`
- Simply remove the clean scripts since they're rarely needed

### Issue 5: Prisma Client Not Generated
Without running `prisma generate`, the `@prisma/client` module has no generated output. This causes import errors in:
- [`packages/database/src/index.ts`](packages/database/src/index.ts:1): `import { PrismaClient } from "@prisma/client"`
- [`apps/api/src/prisma/prisma.service.ts`](apps/api/src/prisma/prisma.service.ts:2): `import { PrismaClient } from "@prisma/client"`
- [`apps/api/src/hardware/hardware.service.ts`](apps/api/src/hardware/hardware.service.ts:3): `import { Prisma } from "@prisma/client"`

**Fix:** Run `pnpm db:generate` (or `cd packages/database && pnpm prisma generate`) before starting dev.

### Issue 6: Database Not Synced
The Prisma schema defines tables but they may not exist in the database yet.

**Fix:** Run `pnpm db:push` to sync the schema to PostgreSQL (requires valid `DATABASE_URL`).

---

## Setup Steps (Execution Order)

```mermaid
flowchart TD
    A[1. Delete package-lock.json] --> B[2. Create .env with DATABASE_URL + DIRECT_URL]
    B --> C[3. Update .env.example with DIRECT_URL]
    C --> D[4. Fix rm -rf scripts for Windows]
    D --> E[5. Run pnpm install]
    E --> F[6. Run prisma generate]
    F --> G[7. Run prisma db push - optional]
    G --> H[8. Run pnpm dev]
```

### Step 1: Delete `package-lock.json`
Remove the npm lock file to avoid conflicts with pnpm.

### Step 2: Create `.env` file
Copy `.env.example` to `.env` and fill in actual Supabase credentials:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_GRAPHQL_API_URL="http://localhost:4000/graphql"
```
Note: For Supabase, `DATABASE_URL` uses the transaction pooler and `DIRECT_URL` uses the session pooler. If not using Supabase pooler, both can be the same string.

### Step 3: Update `.env.example` template
Add `DIRECT_URL` so future developers know it's required:
```
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Step 4: Fix Windows-incompatible clean scripts
Replace `rm -rf` with cross-platform `rimraf` in all 4 package.json files, OR remove the clean scripts entirely.

### Step 5: Run `pnpm install`
Install all workspace dependencies.

### Step 6: Run `pnpm db:generate`
Generate the Prisma client so `@prisma/client` imports resolve.

### Step 7: Run `pnpm db:push` (optional, requires valid DB credentials)
Sync the Prisma schema to the PostgreSQL database.

### Step 8: Run `pnpm dev`
Start the Turbo dev server — both API on port 4000 and Web on port 3000.

---

## Files to Modify

| File | Change |
|------|--------|
| `package-lock.json` | Delete entirely |
| `.env` | Create new with DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_GRAPHQL_API_URL |
| `.env.example` | Add DIRECT_URL line |
| `apps/api/package.json` | Fix clean script for Windows |
| `apps/web/package.json` | Fix clean script for Windows |
| `packages/database/package.json` | Fix clean script for Windows |
| `packages/ui/package.json` | Fix clean script for Windows |

## Commands to Run

```bash
pnpm install
cd packages/database && pnpm prisma generate
pnpm db:push   # optional - needs valid DB URL
pnpm dev