import { Router } from "express";
import { db } from "@workspace/db";
import {
  transcriptRequestsTable,
  studentsTable,
  programsTable,
  enrollmentsTable,
  coursesTable,
  submissionsTable,
  gradesTable,
  assignmentsTable,
} from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/students/:id/transcript", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { purpose = "personal" } = req.body;

    const [request] = await db.insert(transcriptRequestsTable).values({
      studentId,
      purpose,
      status: "generated",
    }).returning();

    res.status(201).json({
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      generatedAt: request.generatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/students/:id/transcript", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    const [studentRow] = await db
      .select({
        id: studentsTable.id,
        firstName: studentsTable.firstName,
        lastName: studentsTable.lastName,
        email: studentsTable.email,
        phone: studentsTable.phone,
        country: studentsTable.country,
        programId: studentsTable.programId,
        programName: programsTable.name,
        programLevel: programsTable.level,
        programDuration: programsTable.durationMonths,
        status: studentsTable.status,
        createdAt: studentsTable.createdAt,
      })
      .from(studentsTable)
      .leftJoin(programsTable, eq(studentsTable.programId, programsTable.id))
      .where(eq(studentsTable.id, studentId));

    if (!studentRow) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const enrollments = await db
      .select({
        id: enrollmentsTable.id,
        courseId: enrollmentsTable.courseId,
        courseTitle: coursesTable.title,
        courseCode: coursesTable.code,
        instructorName: coursesTable.instructorName,
        credits: coursesTable.credits,
        enrolledAt: enrollmentsTable.enrolledAt,
      })
      .from(enrollmentsTable)
      .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .where(eq(enrollmentsTable.studentId, studentId));

    const courseIds = enrollments.map(e => e.courseId);
    let gradeRecords: any[] = [];

    if (courseIds.length > 0) {
      const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentId, studentId));
      if (submissions.length > 0) {
        const grades = await db.select().from(gradesTable)
          .where(inArray(gradesTable.submissionId, submissions.map(s => s.id)));

        gradeRecords = await Promise.all(grades.map(async (g) => {
          const [sub] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, g.submissionId));
          const [asg] = sub
            ? await db.select({
                id: assignmentsTable.id,
                title: assignmentsTable.title,
                maxScore: assignmentsTable.maxScore,
                courseId: assignmentsTable.courseId,
                courseTitle: coursesTable.title,
                courseCode: coursesTable.code,
              }).from(assignmentsTable)
                .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
                .where(eq(assignmentsTable.id, sub.assignmentId))
            : [];
          return {
            ...g,
            assignmentId: sub?.assignmentId ?? null,
            assignmentTitle: asg?.title ?? null,
            courseTitle: asg?.courseTitle ?? null,
            courseCode: asg?.courseCode ?? null,
            maxScore: asg?.maxScore ?? 100,
            gradedAt: g.gradedAt.toISOString(),
          };
        }));
      }
    }

    const gradePoints: Record<string, number> = {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
      "D": 1.0, "F": 0.0,
    };
    const gpa = gradeRecords.length > 0
      ? Math.round((gradeRecords.reduce((sum, g) => sum + (gradePoints[g.letterGrade] ?? 0), 0) / gradeRecords.length) * 100) / 100
      : null;

    const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits ?? 0), 0);

    res.json({
      student: { ...studentRow, createdAt: studentRow.createdAt.toISOString() },
      enrollments: enrollments.map(e => ({ ...e, enrolledAt: e.enrolledAt.toISOString() })),
      grades: gradeRecords,
      gpa,
      totalCredits,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transcripts", requireAuth, async (req, res) => {
  try {
    const requests = await db
      .select({
        id: transcriptRequestsTable.id,
        studentId: transcriptRequestsTable.studentId,
        firstName: studentsTable.firstName,
        lastName: studentsTable.lastName,
        email: studentsTable.email,
        programName: programsTable.name,
        purpose: transcriptRequestsTable.purpose,
        status: transcriptRequestsTable.status,
        requestedAt: transcriptRequestsTable.requestedAt,
        generatedAt: transcriptRequestsTable.generatedAt,
      })
      .from(transcriptRequestsTable)
      .leftJoin(studentsTable, eq(transcriptRequestsTable.studentId, studentsTable.id))
      .leftJoin(programsTable, eq(studentsTable.programId, programsTable.id))
      .orderBy(desc(transcriptRequestsTable.requestedAt));

    res.json(requests.map(r => ({
      ...r,
      requestedAt: r.requestedAt.toISOString(),
      generatedAt: r.generatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
