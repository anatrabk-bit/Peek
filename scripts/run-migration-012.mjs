/**
 * Run 012_generic_payments.sql against your Supabase database.
 *
 * Add to .env.local (from Supabase → Settings → Database → Database password):
 *   SUPABASE_DB_PASSWORD=your_database_password
 *
 * Then: node scripts/run-migration-012.mjs
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    process.env[trimmed.slice(0, index).trim()] = trimmed
      .slice(index + 1)
      .trim();
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!url) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

if (!password) {
  console.error(
    "Missing SUPABASE_DB_PASSWORD in .env.local.\n" +
      "Get it from Supabase Dashboard → Settings → Database → Database password"
  );
  process.exit(1);
}

const projectRef = url.replace("https://", "").split(".")[0];
const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;

const sqlPath = path.join(
  process.cwd(),
  "supabase/migrations/012_generic_payments.sql"
);
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log("Connected. Running 012_generic_payments.sql…");
  await client.query(sql);
  console.log("Migration 012 completed successfully.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
