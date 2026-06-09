import { Router } from "express";
import { db } from "@workspace/db";
import {
  gradesTable, submissionsTable, assignmentsTable, coursesTable,
  studentsTable, enrollmentsTable, programsTable,
} from "@workspace/db";
import { eq, inArray, isNull } from "drizzle-orm";
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

// ─── Admin: all submissions with student + grade info ─────────────────────────
router.get("/admin/submissions", async (req, res) => {
  try {
    const submissions = await db
      .select({
        id: submissionsTable.id,
        assignmentId: submissionsTable.assignmentId,
        studentId: submissionsTable.studentId,
        content: submissionsTable.content,
        submittedAt: submissionsTable.submittedAt,
        studentFirstName: studentsTable.firstName,
        studentLastName: studentsTable.lastName,
        studentEmail: studentsTable.email,
        assignmentTitle: assignmentsTable.title,
        assignmentMaxScore: assignmentsTable.maxScore,
        assignmentDueDate: assignmentsTable.dueDate,
        courseTitle: coursesTable.title,
        courseCode: coursesTable.code,
      })
      .from(submissionsTable)
      .leftJoin(studentsTable, eq(submissionsTable.studentId, studentsTable.id))
      .leftJoin(assignmentsTable, eq(submissionsTable.assignmentId, assignmentsTable.id))
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id));

    const subIds = submissions.map(s => s.id);
    const grades = subIds.length > 0
      ? await db.select().from(gradesTable).where(inArray(gradesTable.submissionId, subIds))
      : [];
    const gradeMap = new Map(grades.map(g => [g.submissionId, g]));

    res.json(submissions.map(s => {
      const grade = gradeMap.get(s.id);
      return {
        ...s,
        submittedAt: s.submittedAt.toISOString(),
        assignmentDueDate: s.assignmentDueDate ? s.assignmentDueDate.toISOString() : null,
        graded: !!grade,
        score: grade?.score ?? null,
        letterGrade: grade?.letterGrade ?? null,
        feedback: grade?.feedback ?? null,
        gradedAt: grade?.gradedAt ? grade.gradedAt.toISOString() : null,
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
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
