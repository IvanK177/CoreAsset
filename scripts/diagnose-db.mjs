import pg from "pg";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const connectionString = process.env.SUPABASE_DB_URL;

async function runDiagnostics() {
  console.log("=== DATABASE DIAGNOSTICS ===");
  if (!connectionString) {
    console.error("❌ SUPABASE_DB_URL is not set in your .env file!");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log("Connecting to PostgreSQL...");
    await client.connect();
    console.log("✅ Successfully connected to the remote database!");

    // Test 1: SELECT 1
    console.log("\n1. Running test query SELECT 1...");
    const res1 = await client.query("SELECT 1 as val");
    console.log("✅ SELECT 1 success:", res1.rows);

    // Test 2: Check computer_templates
    console.log("\n2. Checking table public.computer_templates...");
    try {
      const res2 = await client.query("SELECT * FROM public.computer_templates LIMIT 1");
      console.log("✅ computer_templates exists! Row count returned:", res2.rowCount);
      if (res2.rowCount > 0) {
        console.log("   Sample row keys:", Object.keys(res2.rows[0]));
      }
    } catch (err) {
      console.error("❌ Failed to query computer_templates:", err.message);
    }

    // Test 3: Check incidents
    console.log("\n3. Checking table public.incidents...");
    try {
      const res3 = await client.query("SELECT * FROM public.incidents LIMIT 1");
      console.log("✅ incidents exists! Row count returned:", res3.rowCount);
      if (res3.rowCount > 0) {
        console.log("   Sample row keys:", Object.keys(res3.rows[0]));
      }
    } catch (err) {
      console.error("❌ Failed to query incidents:", err.message);
    }

    // Test 4: Check room_requests
    console.log("\n4. Checking table public.room_requests...");
    try {
      const res4 = await client.query("SELECT * FROM public.room_requests LIMIT 1");
      console.log("✅ room_requests exists! Row count returned:", res4.rowCount);
      if (res4.rowCount > 0) {
        console.log("   Sample row keys:", Object.keys(res4.rows[0]));
      }
    } catch (err) {
      console.error("❌ Failed to query room_requests:", err.message);
    }

    // Test 5: Check devices
    console.log("\n5. Checking table public.devices...");
    try {
      const res5 = await client.query("SELECT * FROM public.devices LIMIT 1");
      console.log("✅ devices exists! Row count returned:", res5.rowCount);
      if (res5.rowCount > 0) {
        console.log("   Sample row keys:", Object.keys(res5.rows[0]));
      }
    } catch (err) {
      console.error("❌ Failed to query devices:", err.message);
    }

  } catch (err) {
    console.error("\n❌ FATAL CONNECTION ERROR:", err.code, err.message);
  } finally {
    await client.end();
    console.log("\n=== DIAGNOSTICS COMPLETE ===");
  }
}

runDiagnostics();
