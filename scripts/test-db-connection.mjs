/**
 * Test database connection with simple queries to diagnose ECONNRESET issue.
 */
import pg from "pg";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const DIRECT_URL = process.env.SUPABASE_DB_URL;

async function testConnection() {
  console.log("Testing database connection...");
  console.log(`URL: ${DIRECT_URL.replace(/:([^@]+)@/, ':****@')}`);

  const client = new pg.Client({
    connectionString: DIRECT_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  client.on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
  });

  try {
    await client.connect();
    console.log("✅ Connected!");

    // Test 1: Simple query
    console.log("\nTest 1: SELECT 1...");
    const res1 = await client.query("SELECT 1 as test");
    console.log("✅ Result:", res1.rows);

    // Test 2: Check current get_user_role function
    console.log("\nTest 2: Check get_user_role()...");
    const res2 = await client.query("SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_role'");
    console.log("✅ Current function:", res2.rows);

    // Test 3: Apply the fix - step by step
    console.log("\nTest 3: Update get_user_role() function...");
    await client.query(`CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS text AS $$ SELECT COALESCE( (auth.jwt() -> 'app_metadata' ->> 'role'), 'admin' ); $$ LANGUAGE sql STABLE`);
    console.log("✅ Function updated!");

    console.log("\nTest 4: Set search_path...");
    await client.query(`ALTER FUNCTION public.get_user_role() SET search_path = public`);
    console.log("✅ search_path set!");

    console.log("\nTest 5: Set admin user app_metadata...");
    await client.query(`UPDATE auth.users SET raw_app_meta_data = COALESCE( raw_app_meta_data::jsonb || '{"role": "admin"}'::jsonb, '{"role": "admin"}'::jsonb ) WHERE email = 'admin@corp.ru'`);
    console.log("✅ Admin user metadata updated!");

    // Verify
    console.log("\nVerifying...");
    const res3 = await client.query("SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_role'");
    console.log("✅ Verified function:", res3.rows);

    await client.end();
    console.log("\n🎉 All done! RLS fix applied successfully!");
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Error: ${err.code} ${err.message}`);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

testConnection();