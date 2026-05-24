/**
 * One-time script to apply pending Supabase migrations to the remote database.
 * 
 * Usage:
 *   1. Get your database connection string from:
 *      Supabase Dashboard → Settings → Database → Connection string (URI)
 *   2. Set SUPABASE_DB_URL in .env:
 *      SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *   3. Run: node scripts/apply-migrations.mjs
 * 
 * Alternatively, you can just run the SQL directly in the Supabase Dashboard SQL Editor:
 *      https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error("❌ SUPABASE_DB_URL not set. Add it to .env:");
  console.error("   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres");
  console.error("");
  console.error("Or apply migrations manually via Supabase Dashboard SQL Editor:");
  console.error("   https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅ Connected to database");

  // Create migrations tracking table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text NOT NULL PRIMARY KEY,
      statements jsonb[],
      name text
    );
  `);

  // Get already applied migrations
  const { rows: applied } = await client.query("SELECT version FROM supabase_migrations.schema_migrations");
  const appliedVersions = new Set(applied.map((r) => r.version));

  // Read and sort migration files
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (appliedVersions.has(file)) {
      console.log(`⏭️  Skipping already applied: ${file}`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`🔄 Applying: ${file}`);

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ($1, $2)", [file, file]);
      await client.query("COMMIT");
      console.log(`✅ Applied: ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ Failed: ${file}`, err.message);
      process.exit(1);
    }
  }

  // Reload PostgREST schema cache so API immediately sees new columns
  try {
    await client.query(`NOTIFY pgrst, 'reload schema'`);
    console.log("🔄 PostgREST schema cache reload signal sent");
  } catch (notifyErr) {
    console.log("⚠️  Could not send NOTIFY (non-critical):", notifyErr.message);
  }

  await client.end();
  console.log("🎉 All migrations applied successfully!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});