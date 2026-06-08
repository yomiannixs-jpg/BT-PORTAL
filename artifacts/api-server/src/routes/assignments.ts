import { Router } from "express";
import { db } from "@workspace/db";
import { assignmentsTable, coursesTable, submissionsTable, gradesTable, enrollmentsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  ListAssignmentsParams,
  CreateAssignmentParams,
  CreateAssignmentBody,
  GetAssignmentParams,
  GetStudentAssignmentsParams,
  SubmitAssignmentParams,
  SubmitAssignmentBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/courses/:id/assignments", async (req, res) => {
  try {
    const { id } = ListAssignmentsParams.parse({ id: Number(req.params.id) });
    const assignments = await db
      .select({
        id: assignmentsTable.id,
        courseId: assignmentsTable.courseId,
        courseTitle: coursesTable.title,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        dueDate: assignmentsTable.dueDate,
        maxScore: assignmentsTable.maxScore,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
      .where(eq(assignmentsTable.courseId, id));
    res.json(assignments.map(a => ({ ...a, dueDate: a.dueDate.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.post("/courses/:id/assignments", async (req, res) => {
  try {
    const { id } = CreateAssignmentParams.parse({ id: Number(req.params.id) });
    const body = CreateAssignmentBody.parse(req.body);
    const [assignment] = await db.insert(assignmentsTable).values({
      courseId: id,
      title: body.title,
      description: body.description ?? null,
      dueDate: new Date(body.dueDate),
      maxScore: body.maxScore,
    }).returning();
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    res.status(201).json({ ...assignment, courseTitle: course?.title ?? null, dueDate: assignment.dueDate.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/assignments/:id", async (req, res) => {
  try {
    const { id } = GetAssignmentParams.parse({ id: Number(req.params.id) });
    const [assignment] = await db
      .select({
        id: assignmentsTable.id,
        courseId: assignmentsTable.courseId,
        courseTitle: coursesTable.title,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        dueDate: assignmentsTable.dueDate,
        maxScore: assignmentsTable.maxScore,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
      .where(eq(assignmentsTable.id, id));
    if (!assignment) return res.status(404).json({ error: "Not found" });
    res.json({ ...assignment, dueDate: assignment.dueDate.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/students/:id/assignments", async (req, res) => {
  try {
    const { id } = GetStudentAssignmentsParams.parse({ id: Number(req.params.id) });
    const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.studentId, id));
    const courseIds = enrollments.map(e => e.courseId);
    if (courseIds.length === 0) return res.json([]);
    const assignments = await db
      .select({
        id: assignmentsTable.id,
        courseId: assignmentsTable.courseId,
        courseTitle: coursesTable.title,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        dueDate: assignmentsTable.dueDate,
        maxScore: assignmentsTable.maxScore,
      })
      .from(assignmentsTable)
      .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
      .where(inArray(assignmentsTable.courseId, courseIds));
    const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentId, id));
    const submissionMap = new Map(submissions.map(s => [s.assignmentId, s]));
    const grades = submissions.length > 0
      ? await db.select().from(gradesTable).where(inArray(gradesTable.submissionId, submissions.map(s => s.id)))
      : [];
    const gradeMap = new Map(grades.map(g => [g.submissionId, g]));
    res.json(assignments.map(a => {
      const sub = submissionMap.get(a.id);
      const grade = sub ? gradeMap.get(sub.id) : undefined;
      return {
        ...a,
        dueDate: a.dueDate.toISOString(),
        submitted: !!sub,
        submissionId: sub?.id ?? null,
        score: grade?.score ?? null,
        grade: grade?.letterGrade ?? null,
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.post("/assignments/:id/submit", async (req, res) => {
  try {
    const { id } = SubmitAssignmentParams.parse({ id: Number(req.params.id) });
    const body = SubmitAssignmentBody.parse(req.body);
    const [submission] = await db.insert(submissionsTable).values({
      assignmentId: id,
      studentId: body.studentId,
      content: body.content ?? null,
    }).returning();
    res.status(201).json({ ...submission, submittedAt: submission.submittedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
