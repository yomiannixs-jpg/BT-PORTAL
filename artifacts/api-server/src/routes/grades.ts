import { Router } from "express";
import { db } from "@workspace/db";
import { gradesTable, submissionsTable, assignmentsTable, coursesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetStudentGradesParams,
  GradeSubmissionParams,
  GradeSubmissionBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/students/:id/grades", async (req, res) => {
  try {
    const { id } = GetStudentGradesParams.parse({ id: Number(req.params.id) });
    const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentId, id));
    if (submissions.length === 0) return res.json([]);
    const results = await Promise.all(
      submissions.map(async (sub) => {
        const [grade] = await db.select().from(gradesTable).where(eq(gradesTable.submissionId, sub.id));
        if (!grade) return null;
        const [assignment] = await db
          .select({
            id: assignmentsTable.id,
            title: assignmentsTable.title,
            maxScore: assignmentsTable.maxScore,
            courseTitle: coursesTable.title,
          })
          .from(assignmentsTable)
          .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
          .where(eq(assignmentsTable.id, sub.assignmentId));
        return {
          ...grade,
          assignmentId: sub.assignmentId,
          assignmentTitle: assignment?.title ?? null,
          courseTitle: assignment?.courseTitle ?? null,
          maxScore: assignment?.maxScore ?? 100,
          gradedAt: grade.gradedAt.toISOString(),
        };
      })
    );
    res.json(results.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.patch("/submissions/:id/grade", async (req, res) => {
  try {
    const { id } = GradeSubmissionParams.parse({ id: Number(req.params.id) });
    const body = GradeSubmissionBody.parse(req.body);
    const existing = await db.select().from(gradesTable).where(eq(gradesTable.submissionId, id));
    let grade;
    if (existing.length > 0) {
      const [updated] = await db.update(gradesTable).set({
        score: body.score,
        letterGrade: body.letterGrade,
        ...(body.feedback !== undefined && { feedback: body.feedback }),
      }).where(eq(gradesTable.submissionId, id)).returning();
      grade = updated;
    } else {
      const [created] = await db.insert(gradesTable).values({
        submissionId: id,
        score: body.score,
        letterGrade: body.letterGrade,
        feedback: body.feedback ?? null,
      }).returning();
      grade = created;
    }
    const [sub] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, id));
    const [assignment] = sub
      ? await db.select({
          id: assignmentsTable.id,
          title: assignmentsTable.title,
          maxScore: assignmentsTable.maxScore,
          courseTitle: coursesTable.title,
        }).from(assignmentsTable)
          .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
          .where(eq(assignmentsTable.id, sub.assignmentId))
      : [];
    res.json({
      ...grade,
      assignmentId: sub?.assignmentId ?? null,
      assignmentTitle: assignment?.title ?? null,
      courseTitle: assignment?.courseTitle ?? null,
      maxScore: assignment?.maxScore ?? 100,
      gradedAt: grade.gradedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
