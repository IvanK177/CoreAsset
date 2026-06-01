import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import { getCachedTemplates, getCachedIncidentsWithRelations } from "../lib/supabase/cached.js";

async function main() {
  console.log("Starting query diagnostic test...");
  try {
    console.log("Testing getCachedTemplates()...");
    const templates = await getCachedTemplates();
    console.log("✅ getCachedTemplates success! Count:", templates.length);
  } catch (err) {
    console.error("❌ getCachedTemplates error:", err.message, err.stack);
  }

  try {
    console.log("Testing getCachedIncidentsWithRelations()...");
    const incidents = await getCachedIncidentsWithRelations();
    console.log("✅ getCachedIncidentsWithRelations success! Count:", incidents.length);
  } catch (err) {
    console.error("❌ getCachedIncidentsWithRelations error:", err.message, err.stack);
  }
}

main();
