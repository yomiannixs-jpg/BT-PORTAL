import { Router } from "express";
import { db } from "@workspace/db";
import { programsTable, coursesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { GetProgramParams } from "@workspace/api-zod";

const router = Router();

router.get("/programs", async (req, res) => {
  try {
    const programs = await db.select().from(programsTable);
    const courseCounts = await db
      .select({ programId: coursesTable.programId, count: sql<number>`count(*)::int` })
      .from(coursesTable)
      .groupBy(coursesTable.programId);
    const countMap = new Map(courseCounts.map(c => [c.programId, c.count]));
    res.json(programs.map(p => ({ ...p, courseCount: countMap.get(p.id) ?? 0 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/programs/:id", async (req, res) => {
  try {
    const { id } = GetProgramParams.parse({ id: Number(req.params.id) });
    const [program] = await db.select().from(programsTable).where(eq(programsTable.id, id));
    if (!program) return res.status(404).json({ error: "Not found" });
    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(coursesTable)
      .where(eq(coursesTable.programId, id));
    res.json({ ...program, courseCount: count?.count ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
