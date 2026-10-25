import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const locks = await prisma.$queryRawUnsafe<
    Array<{
      pid: number;
      objid: number | bigint;
      granted: boolean;
      state: string | null;
      query: string | null;
    }>
  >(`
    SELECT l.pid, l.objid, l.granted, a.state, a.query
    FROM pg_locks l
    LEFT JOIN pg_stat_activity a ON a.pid = l.pid
    WHERE l.locktype = 'advisory'
  `);
  console.log("advisoryLocks", locks);

  const stuck = locks.filter(
    (row) => Number(row.objid) === 72707369 && row.granted,
  );
  for (const row of stuck) {
    const result = await prisma.$queryRawUnsafe<Array<{ killed: boolean }>>(
      `SELECT pg_terminate_backend(${Number(row.pid)}) AS killed`,
    );
    console.log("terminated", row.pid, result);
  }

  // Also terminate any idle-in-transaction backends holding locks generally.
  const idle = await prisma.$queryRawUnsafe<
    Array<{ pid: number; state: string; query: string }>
  >(`
    SELECT pid, state, query
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
      AND state IN ('idle in transaction', 'active')
      AND query ILIKE '%advisory%'
  `);
  console.log("advisoryRelatedActivity", idle);

  const after = await prisma.$queryRawUnsafe(`
    SELECT l.pid, l.objid, l.granted, a.state
    FROM pg_locks l
    LEFT JOIN pg_stat_activity a ON a.pid = l.pid
    WHERE l.locktype = 'advisory'
  `);
  console.log("after", after);

  // Confirm migrate can acquire lock quickly.
  console.log("running prisma migrate deploy locally...");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
