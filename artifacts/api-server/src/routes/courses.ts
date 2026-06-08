import { Router } from "express";
import { db } from "@workspace/db";
import { coursesTable, programsTable, enrollmentsTable, studentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  CreateCourseBody,
  GetCourseParams,
  EnrollInCourseParams,
  EnrollInCourseBody,
  GetStudentEnrollmentsParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/courses", async (req, res) => {
  try {
    const courses = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
        code: coursesTable.code,
        description: coursesTable.description,
        programId: coursesTable.programId,
        programName: programsTable.name,
        instructorName: coursesTable.instructorName,
        credits: coursesTable.credits,
        status: coursesTable.status,
      })
      .from(coursesTable)
      .leftJoin(programsTable, eq(coursesTable.programId, programsTable.id));
    const counts = await db
      .select({ courseId: enrollmentsTable.courseId, count: sql<number>`count(*)::int` })
      .from(enrollmentsTable)
      .groupBy(enrollmentsTable.courseId);
    const countMap = new Map(counts.map(c => [c.courseId, c.count]));
    res.json(courses.map(c => ({ ...c, enrollmentCount: countMap.get(c.id) ?? 0 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/courses", async (req, res) => {
  try {
    const body = CreateCourseBody.parse(req.body);
    const [course] = await db.insert(coursesTable).values({
      title: body.title,
      code: body.code,
      description: body.description ?? null,
      programId: body.programId,
      instructorName: body.instructorName,
      credits: body.credits ?? 3,
      status: body.status ?? "active",
    }).returning();
    const [prog] = await db.select().from(programsTable).where(eq(programsTable.id, course.programId));
    res.status(201).json({ ...course, programName: prog?.name ?? null, enrollmentCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const { id } = GetCourseParams.parse({ id: Number(req.params.id) });
    const [course] = await db
      .select({
        id: coursesTable.id,
        title: coursesTable.title,
        code: coursesTable.code,
        description: coursesTable.description,
        programId: coursesTable.programId,
        programName: programsTable.name,
        instructorName: coursesTable.instructorName,
        credits: coursesTable.credits,
        status: coursesTable.status,
      })
      .from(coursesTable)
      .leftJoin(programsTable, eq(coursesTable.programId, programsTable.id))
      .where(eq(coursesTable.id, id));
    if (!course) return res.status(404).json({ error: "Not found" });
    const [count] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.courseId, id));
    res.json({ ...course, enrollmentCount: count?.count ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.post("/courses/:id/enroll", async (req, res) => {
  try {
    const { id } = EnrollInCourseParams.parse({ id: Number(req.params.id) });
    const body = EnrollInCourseBody.parse(req.body);
    const existing = await db.select().from(enrollmentsTable)
      .where(eq(enrollmentsTable.courseId, id));
    const alreadyEnrolled = existing.find(e => e.studentId === body.studentId);
    if (alreadyEnrolled) {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
      res.status(201).json({
        ...alreadyEnrolled,
        courseTitle: course?.title ?? null,
        courseCode: course?.code ?? null,
        instructorName: course?.instructorName ?? null,
        credits: course?.credits ?? null,
        enrolledAt: alreadyEnrolled.enrolledAt.toISOString(),
      });
      return;
    }
    const [enrollment] = await db.insert(enrollmentsTable).values({
      studentId: body.studentId,
      courseId: id,
    }).returning();
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    res.status(201).json({
      ...enrollment,
      courseTitle: course?.title ?? null,
      courseCode: course?.code ?? null,
      instructorName: course?.instructorName ?? null,
      credits: course?.credits ?? null,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/students/:id/enrollments", async (req, res) => {
  try {
    const { id } = GetStudentEnrollmentsParams.parse({ id: Number(req.params.id) });
    const enrollments = await db
      .select({
        id: enrollmentsTable.id,
        studentId: enrollmentsTable.studentId,
        courseId: enrollmentsTable.courseId,
        courseTitle: coursesTable.title,
        courseCode: coursesTable.code,
        instructorName: coursesTable.instructorName,
        credits: coursesTable.credits,
        enrolledAt: enrollmentsTable.enrolledAt,
      })
      .from(enrollmentsTable)
      .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .where(eq(enrollmentsTable.studentId, id));
    res.json(enrollments.map(e => ({ ...e, enrolledAt: e.enrolledAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
