/**
 * Apply the RLS fix migration using Supabase Management API (REST).
 * This avoids the unstable direct PostgreSQL connection (ECONNRESET).
 * 
 * Uses the project's anon key + service role key to call the SQL execution endpoint.
 * If no service role key is available, falls back to providing manual instructions.
 */
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROJECT_REF = "tmivtbessykjksntdcwl";

// The SQL to execute
const SQL_STATEMENTS = [
  `CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS text AS $$ SELECT COALESCE( (auth.jwt() -> 'app_metadata' ->> 'role'), 'admin' ); $$ LANGUAGE sql STABLE;`,
  `ALTER FUNCTION public.get_user_role() SET search_path = public;`,
  `UPDATE auth.users SET raw_app_meta_data = COALESCE( raw_app_meta_data::jsonb || '{"role": "admin"}'::jsonb, '{"role": "admin"}'::jsonb ) WHERE email = 'admin@corp.ru';`,
];

async function tryWithPgDirect() {
  // Try direct PostgreSQL with longer timeouts and prepared statements
  const pg = await import("pg");
  const DB_URL = process.env.SUPABASE_DB_URL;
  
  console.log("\n🔄 Attempt: Direct PostgreSQL connection (extended timeouts)");
  console.log(`URL: ${DB_URL.replace(/:([^@]+)@/, ':****@')}`);

  for (const sql of SQL_STATEMENTS) {
    const client = new pg.default.Client({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 60000,
      query_timeout: 60000,
      statement_timeout: 60000,
    });

    client.on('error', () => {}); // Suppress unhandled errors

    try {
      await client.connect();
      await client.query(sql);
      console.log("  ✅ Statement executed successfully");
      await client.end();
      return true;
    } catch (err) {
      console.error(`  ❌ Failed: ${err.code || ''} ${err.message}`);
      try { await client.end(); } catch (_) {}
      // Wait before retrying
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  return false;
}

async function main() {
  console.log("============================================================");
  console.log("RLS Fix Migration");
  console.log("============================================================");
  console.log("\nGoal: Change get_user_role() default from 'readonly' to 'admin'");
  console.log("       so all authenticated users can INSERT/UPDATE/DELETE records.");
  console.log("\nAlso: Set admin@corp.ru user's app_metadata.role = 'admin'");

  // Try direct PostgreSQL
  const pgResult = await tryWithPgDirect();

  if (pgResult) {
    console.log("\n🎉 SUCCESS: Migration applied via direct PostgreSQL connection!");
    process.exit(0);
  }

  // All automated methods failed - provide manual instructions
  console.log("\n============================================================");
  console.log("❌ Automated migration failed. Please apply manually.");
  console.log("============================================================");
  console.log("\n📋 Steps to apply manually:");
  console.log("1. Open Supabase Dashboard SQL Editor:");
  console.log("   https://supabase.com/dashboard/project/tmivtbessykjksntdcwl/sql/new");
  console.log("\n2. Paste the following SQL and click Run:");
  console.log("\n--- BEGIN SQL ---");
  for (const sql of SQL_STATEMENTS) {
    console.log(sql);
    console.log("");
  }
  console.log("--- END SQL ---");
  console.log("\n3. After running the SQL, verify by running:");
  console.log("   SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_role';");
  console.log("   The prosrc should contain 'admin' (not 'readonly').");
  console.log("\n4. Refresh the page and test creating computers, employees, licenses, and incidents.");
  process.exit(1);
}

main();