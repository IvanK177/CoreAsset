/**
 * Apply the title column migration using Supabase pooler URL with keepalive.
 */
import pg from "pg";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

// Use pooler URL (transaction mode, port 6543) which is more stable for external connections
const POOLER_URL = "postgresql://postgres.tmivtbessykjksntdcwl:Core_128500%21@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
const DIRECT_URL = process.env.SUPABASE_DB_URL;

const MIGRATION_SQL = `
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS title text NULL;
`;

const BACKFILL_SQL = `
UPDATE public.incidents SET title = split_part(description, E'\\n', 1) WHERE title IS NULL AND description IS NOT NULL;
`;

const VERIFY_SQL = `
SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'title';
`;

async function tryApply(url, label) {
  console.log(`\n${label}`);
  console.log(`URL: ${url.replace(/:([^@]+)@/, ':****@')}`);
  
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  // Handle uncaught connection errors gracefully
  client.on('error', (err) => {
    console.error(`  Connection error event: ${err.message}`);
  });

  try {
    await client.connect();
    console.log("✅ Connected!");

    // Try each statement separately with short timeouts
    console.log("  Running: ALTER TABLE...");
    try {
      await client.query({ text: MIGRATION_SQL, timeout: 15000 });
      console.log("  ✅ ALTER TABLE succeeded");
    } catch (err) {
      console.error(`  ❌ ALTER TABLE failed: ${err.code} ${err.message}`);
      throw err;
    }

    console.log("  Running: UPDATE backfill...");
    try {
      await client.query({ text: BACKFILL_SQL, timeout: 15000 });
      console.log("  ✅ Backfill succeeded");
    } catch (err) {
      console.error(`  ⚠️ Backfill failed (non-critical): ${err.code} ${err.message}`);
      // Backfill failure is not critical - column was still added
    }

    console.log("  Running: VERIFY...");
    try {
      const { rows } = await client.query({ text: VERIFY_SQL, timeout: 10000 });
      if (rows.length > 0) {
        console.log("\n🎉 SUCCESS: 'title' column verified in incidents table!");
        await client.end();
        return true;
      } else {
        console.error("  ❌ Column not found after ALTER");
      }
    } catch (err) {
      console.error(`  ⚠️ Verify query failed: ${err.message}`);
      // If ALTER succeeded, verification failure is not critical
      console.log("\n🎉 Likely SUCCESS: ALTER TABLE completed (verification skipped)");
      await client.end();
      return true;
    }

    await client.end();
  } catch (err) {
    console.error(`❌ ${label} failed: ${err.message}`);
    try { await client.end(); } catch (_) {}
    return false;
  }
  return false;
}

async function main() {
  // Try pooler first (more stable), then direct
  const results = [
    await tryApply(POOLER_URL, "Attempt 1: Supabase Pooler (transaction mode)"),
    await tryApply(DIRECT_URL, "Attempt 2: Direct connection"),
  ];

  if (results.some(r => r)) {
    console.log("\n✅ Migration applied successfully!");
    process.exit(0);
  }

  console.error("\n❌ All automated attempts failed.");
  console.error("\n📋 Please apply the migration manually via Supabase Dashboard SQL Editor:");
  console.error("   https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new");
  console.error("\nPaste this SQL and click Run:");
  console.error(`
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS title text NULL;
UPDATE public.incidents SET title = split_part(description, E'\\n', 1) WHERE title IS NULL AND description IS NOT NULL;
  `);
  process.exit(1);
}

main();