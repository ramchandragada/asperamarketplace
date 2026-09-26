# Deployment continuity (agent policy)

After every completed vertical slice on this repo:

1. Run typecheck + unit tests.
2. Commit and `git push -u origin <branch>`.
3. Ensure the Vercel **preview** for that branch is READY (GitHub integration usually auto-deploys on push; if needed, force a redeploy).
4. If the slice changes schema or seed data, run `pnpm db:migrate` and `pnpm db:seed` against the shared **Neon non-production** database used by preview (never invent production credentials).
5. Smoke the preview URL (home / browse) without printing secrets.
6. Update the open draft PR description with the preview URL and commit SHA.

Do **not** wait for an explicit “deploy” message from the operator.

Do **not** auto-merge stacked PRs onto `main`. Production `asperamarketplace.vercel.app` stays on `main` until a deliberate release merge.
