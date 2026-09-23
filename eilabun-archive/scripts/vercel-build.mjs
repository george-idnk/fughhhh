// Cloud build (Vercel or any host with PostgreSQL). Vercel runs this automatically
// because package.json defines a "vercel-build" script.
//
// 1. Derives a PostgreSQL copy of prisma/schema.prisma (the dev schema uses SQLite).
// 2. Creates/updates the database tables (prisma db push — non-destructive).
// 3. Creates/updates the admin from ADMIN_EMAIL / ADMIN_PASSWORD and adds demo
//    entries if the archive is empty.
// 4. Builds Next.js.
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  fail(
    "DATABASE_URL must be a PostgreSQL URL (e.g. from Neon). In Vercel: Storage → Create Database → Neon, connect it to this project, then redeploy.",
  );
}
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  fail("AUTH_SECRET is missing or shorter than 32 characters. Add it in Vercel → Settings → Environment Variables, then redeploy.");
}

const SCHEMA = "prisma/postgres/schema.prisma";
mkdirSync("prisma/postgres", { recursive: true });
const pg = readFileSync("prisma/schema.prisma", "utf8").replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
writeFileSync(SCHEMA, pg);

const run = (cmd, env = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });

// Schema changes need a direct (non-pooled) connection when one is available.
const direct = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || dbUrl;
run(`npx prisma db push --schema ${SCHEMA} --skip-generate`, { DATABASE_URL: direct });
run(`npx prisma generate --schema ${SCHEMA}`);
run("npx tsx scripts/deploy-setup.ts", { DATABASE_URL: direct });
run("npx next build");
