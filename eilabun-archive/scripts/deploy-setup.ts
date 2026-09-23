/**
 * Runs during cloud builds (see scripts/vercel-build.mjs):
 *  - creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD, or updates its password
 *    (so changing ADMIN_PASSWORD and redeploying resets it);
 *  - adds the demo entries only when the archive is empty (unless SEED_DEMO=false).
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({ where: { email }, create: { email, passwordHash }, update: { passwordHash } });
    console.log(`✔ Admin account ready: ${email}`);
  } else if ((await prisma.adminUser.count()) === 0) {
    console.warn("⚠ No admin yet — set ADMIN_EMAIL and ADMIN_PASSWORD, then redeploy.");
  }

  if (process.env.SEED_DEMO !== "false" && (await prisma.recording.count()) === 0) {
    await prisma.$disconnect();
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: { ...process.env, ADMIN_EMAIL: "", ADMIN_PASSWORD: "" } });
  }
}

main()
  .catch((e) => {
    console.error(`✖ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
