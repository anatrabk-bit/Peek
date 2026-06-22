/**
 * Apply pending SQL migrations from supabase/migrations/
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_DB_PASSWORD  (Supabase → Settings → Database → Database password)
 *
 * Optional override:
 *   SUPABASE_DB_URL=postgresql://postgres:...@db.xxx.supabase.co:5432/postgres
 *
 * Usage:
 *   npm run db:migrate
 *   npm run db:migrate -- --status
 *   npm run db:migrate -- --baseline   (mark all files applied without running SQL)
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const { Client } = pg;

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const TRACKING_TABLE = "peek_migration_history";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    process.env[key] = value;
  }
}

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }
  return url.replace("https://", "").split(".")[0];
}

function getConnectionCandidates() {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      "Missing SUPABASE_DB_PASSWORD in .env.local.\n" +
        "Supabase → Database → Configuration → Settings → Reset database password"
    );
  }

  const projectRef = getProjectRef();
  const encoded = encodeURIComponent(password);
  const candidates = [];

  const explicit = process.env.SUPABASE_DB_URL?.trim();
  if (explicit) {
    candidates.push(explicit);
  }

  candidates.push(
    `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:6543/postgres`
  );

  const region = process.env.SUPABASE_DB_REGION?.trim();
  const regions = region
    ? [region]
    : [
        "eu-central-1",
        "us-east-1",
        "eu-west-1",
        "us-west-1",
        "ap-southeast-1",
        "ap-northeast-1"
      ];

  for (const awsRegion of regions) {
    const host = `aws-${awsRegion}.pooler.supabase.com`;
    candidates.push(
      `postgresql://postgres.${projectRef}:${encoded}@${host}:5432/postgres`,
      `postgresql://postgres.${projectRef}:${encoded}@${host}:6543/postgres`
    );
  }

  return candidates;
}

async function connectClient() {
  const candidates = getConnectionCandidates();
  let lastError;

  for (const connectionString of candidates) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => {});
    }
  }

  throw new Error(
    `${lastError?.message ?? "Could not connect"}.\n` +
      "Check SUPABASE_DB_PASSWORD (reset in Database → Configuration → Settings).\n" +
      "Or paste the Session pooler URI from Connect into SUPABASE_DB_URL in .env.local."
  );
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations folder not found: ${MIGRATIONS_DIR}`);
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function ensureTrackingTable(client) {
  await client.query(`
    create table if not exists public.${TRACKING_TABLE} (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
}

async function getAppliedFilenames(client) {
  const result = await client.query(
    `select filename from public.${TRACKING_TABLE} order by filename`
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function markApplied(client, filename) {
  await client.query(
    `insert into public.${TRACKING_TABLE} (filename) values ($1)
     on conflict (filename) do nothing`,
    [filename]
  );
}

async function runMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, "utf8");

  await client.query("begin");
  try {
    await client.query(sql);
    await markApplied(client, filename);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

function printHelp() {
  console.log(`
Peek database migrations

  npm run db:migrate              Apply pending migrations
  npm run db:migrate -- --status  Show applied vs pending
  npm run db:migrate -- --baseline
                                  Mark all migration files as applied (no SQL run)
                                  Use once if you already ran SQL manually in Supabase
`);
}

loadEnvLocal();

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

const client = await connectClient();

try {
  await ensureTrackingTable(client);

  const files = listMigrationFiles();
  const applied = await getAppliedFilenames(client);
  const pending = files.filter((file) => !applied.has(file));

  if (args.has("--status")) {
    console.log(`Applied (${files.length - pending.length}):`);
    for (const file of files) {
      if (applied.has(file)) console.log(`  ✓ ${file}`);
    }
    console.log(`Pending (${pending.length}):`);
    for (const file of pending) {
      console.log(`  · ${file}`);
    }
    process.exit(0);
  }

  if (args.has("--baseline")) {
    let marked = 0;
    for (const file of files) {
      if (!applied.has(file)) {
        await markApplied(client, file);
        marked += 1;
        console.log(`Marked applied: ${file}`);
      }
    }
    console.log(
      marked > 0
        ? `Baseline complete (${marked} file(s) marked).`
        : "Nothing to baseline — all migration files already recorded."
    );
    process.exit(0);
  }

  if (pending.length === 0) {
    console.log("Database is up to date — no pending migrations.");
    process.exit(0);
  }

  console.log(`Applying ${pending.length} migration(s)…`);
  for (const file of pending) {
    console.log(`→ ${file}`);
    await runMigration(client, file);
    console.log(`  ✓ done`);
  }
  console.log("All pending migrations applied.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
