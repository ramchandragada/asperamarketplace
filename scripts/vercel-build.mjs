// Vercel build entry point.
//
// `prisma migrate deploy` takes a Postgres advisory lock. When a preview build
// and the production build run at the same time against the shared database,
// they fight over that lock and the loser dies with P1002, leaving production
// on the previous deployment (see docs/SESSION_HANDOFF.md §11).
//
// Fix: only production deploys apply migrations. Preview builds just generate
// the client and compile, so they can never contend with the production build.
import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

const vercelEnv = process.env.VERCEL_ENV ?? "unknown";

if (vercelEnv === "production") {
  console.log("[vercel-build] production deploy — applying migrations");
  run("prisma migrate deploy");
} else {
  console.log(
    `[vercel-build] ${vercelEnv} deploy — skipping migrations (production-only)`,
  );
}

run("prisma generate");
run("next build");
