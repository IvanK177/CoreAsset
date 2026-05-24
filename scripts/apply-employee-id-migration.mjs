import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error("SUPABASE_DB_URL not set in .env");
  process.exit(1);
}

const MIGRATIONS = [
  "20260522_add_employee_id_to_computers.sql",
  "20260522_add_employee_id_to_incidents.sql",
];

async function main() {
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log("Connected to database");

    for (const file of MIGRATIONS) {
      const sql = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations", file),
        "utf8"
      );
      await client.query(sql);
      console.log(`Applied: ${file}`);
    }
    
    console.log("All migrations applied successfully");
    
    // Reload schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("Schema cache reload signaled");
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();