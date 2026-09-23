// One-command first-time setup (Windows, macOS, Linux):
//   npm run quickstart
// Creates .env with a random AUTH_SECRET (if missing), creates the database
// and adds the demo entries. Safe to run more than once.
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("✔ Created .env");
}
let env = readFileSync(".env", "utf8");
if (/^AUTH_SECRET=\s*$/m.test(env)) {
  env = env.replace(/^AUTH_SECRET=\s*$/m, `AUTH_SECRET=${randomBytes(48).toString("base64")}`);
  writeFileSync(".env", env);
  console.log("✔ Generated AUTH_SECRET");
}

run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");

console.log(`
✔ Ready.
  Next steps:
    1) npm run admin:create   (create your admin email + password)
    2) npm run dev            (then open http://localhost:3000)
`);
