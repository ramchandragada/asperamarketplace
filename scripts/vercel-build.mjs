// Vercel build entry point.
//
// `prisma migrate deploy` takes a Postgres advisory lock. When a preview build
// and the production build run at the same time against the shared database,
// they fight over that lock and the loser dies with P1002, leaving production
// on the previous deployment (see docs/SESSION_HANDOFF.md §11).
//
// Fixes: (1) only production deploys apply migrations — preview builds just
// generate the client and compile, so they can never contend for the lock;
// (2) the production migrate retries with backoff, so a transient P1002 lock
// (e.g. two production builds close together) no longer fails the deploy.
import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function runWithRetry(command, tries = 5) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      run(command);
      return;
    } catch (error) {
      if (attempt === tries) throw error;
      const waitSeconds = attempt * 8; // 8s, 16s, 24s, 32s
      console.warn(
        `[vercel-build] "${command}" failed (attempt ${attempt}/${tries}); ` +
          `retrying in ${waitSeconds}s — likely the Prisma advisory lock (P1002).`,
      );
      execSync(`sleep ${waitSeconds}`);
    }
  }
}

const vercelEnv = process.env.VERCEL_ENV ?? "unknown";

if (vercelEnv === "production") {
  console.log("[vercel-build] production deploy — applying migrations");
  runWithRetry("prisma migrate deploy");
} else {
  console.log(
    `[vercel-build] ${vercelEnv} deploy — skipping migrations (production-only)`,
  );
}

run("prisma generate");
run("next build");
