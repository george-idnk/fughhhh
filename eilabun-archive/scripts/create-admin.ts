/**
 * Create or reset an administrator account.
 *
 *   npm run admin:create                               # interactive prompts
 *   npm run admin:create -- admin@example.org          # prompts for password
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create # non-interactive
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prisma = new PrismaClient();

async function prompt(question: string, hidden = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (hidden) {
    // Mask typed characters.
    const out = rl as unknown as { _writeToOutput: (s: string) => void };
    out._writeToOutput = (s: string) => {
      if (s.includes(question)) stdout.write(s);
      else stdout.write("*");
    };
  }
  const answer = await rl.question(question);
  rl.close();
  if (hidden) stdout.write("\n");
  return answer.trim();
}

async function main() {
  let email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!email) email = (await prompt("Admin email: ")).toLowerCase();
  if (!password) {
    password = await prompt("Password (min 10 characters): ", true);
    const again = await prompt("Repeat password: ", true);
    if (password !== again) throw new Error("Passwords do not match");
  }
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error("Invalid email");
  if (password.length < 10) throw new Error("Password must be at least 10 characters");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });
  console.log(`✔ Admin account ready: ${user.email}. Sign in at /admin/login`);
}

main()
  .catch((e) => {
    console.error(`✖ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
