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

// ─── Student: check own request status ───────────────────────────────────────
router.get("/students/:id/transcript/status", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const [latest] = await db
      .select()
      .from(transcriptRequestsTable)
      .where(eq(transcriptRequestsTable.studentId, studentId))
      .orderBy(desc(transcriptRequestsTable.requestedAt))
      .limit(1);

    if (!latest) {
      res.json({ exists: false, status: "none", requestId: null, adminNotes: null, approvedAt: null });
      return;
    }

    res.json({
      exists: true,
      status: latest.status,
      requestId: latest.id,
      purpose: latest.purpose,
      paymentConfirmed: latest.paymentConfirmed,
      adminNotes: latest.adminNotes,
      requestedAt: latest.requestedAt.toISOString(),
      approvedAt: latest.approvedAt ? latest.approvedAt.toISOString() : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Student: submit a transcript request ────────────────────────────────────
router.post("/students/:id/transcript", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { purpose = "personal" } = req.body;

    // Block duplicate pending/approved requests
    const existing = await db
      .select()
      .from(transcriptRequestsTable)
      .where(eq(transcriptRequestsTable.studentId, studentId))
      .orderBy(desc(transcriptRequestsTable.requestedAt))
      .limit(1);

    if (existing.length > 0 && (existing[0].status === "pending" || existing[0].status === "approved")) {
      res.status(409).json({ error: "request_exists", status: existing[0].status, requestId: existing[0].id });
      return;
    }

    const [request] = await db.insert(transcriptRequestsTable).values({
      studentId,
      purpose,
      status: "pending",
      paymentConfirmed: false,
    }).returning();

    res.status(201).json({
      ...request,
      requestedAt: request.requestedAt.toISOString(),
      generatedAt: request.generatedAt.toISOString(),
      approvedAt: null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Student: view transcript (only if approved) ─────────────────────────────
router.get("/students/:id/transcript", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    const [latestRequest] = await db
      .select()
      .from(transcriptRequestsTable)
      .where(eq(transcriptRequestsTable.studentId, studentId))
      .orderBy(desc(transcriptRequestsTable.requestedAt))
      .limit(1);

    if (!latestRequest || latestRequest.status !== "approved") {
      res.status(403).json({
        error: "access_denied",
        requestStatus: latestRequest ? latestRequest.status : "none",
        adminNotes: latestRequest?.adminNotes ?? null,
      });
      return;
    }

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

    const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentId, studentId));
    let gradeRecords: any[] = [];

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
      requestId: latestRequest.id,
      purpose: latestRequest.purpose,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: list all transcript requests ─────────────────────────────────────
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
        paymentConfirmed: transcriptRequestsTable.paymentConfirmed,
        adminNotes: transcriptRequestsTable.adminNotes,
        requestedAt: transcriptRequestsTable.requestedAt,
        approvedAt: transcriptRequestsTable.approvedAt,
        generatedAt: transcriptRequestsTable.generatedAt,
      })
      .from(transcriptRequestsTable)
      .leftJoin(studentsTable, eq(transcriptRequestsTable.studentId, studentsTable.id))
      .leftJoin(programsTable, eq(studentsTable.programId, programsTable.id))
      .orderBy(desc(transcriptRequestsTable.requestedAt));

    res.json(requests.map(r => ({
      ...r,
      requestedAt: r.requestedAt.toISOString(),
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      generatedAt: r.generatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Admin: approve or deny a transcript request ──────────────────────────────
router.patch("/transcripts/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { action, adminNotes, paymentConfirmed } = req.body;

    if (!["approve", "deny"].includes(action)) {
      res.status(400).json({ error: "action must be 'approve' or 'deny'" });
      return;
    }

    const updateData: Record<string, any> = {
      status: action === "approve" ? "approved" : "denied",
      adminNotes: adminNotes ?? null,
    };

    if (action === "approve") {
      updateData.approvedAt = new Date();
      updateData.paymentConfirmed = paymentConfirmed === true;
    }

    const [updated] = await db
      .update(transcriptRequestsTable)
      .set(updateData)
      .where(eq(transcriptRequestsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    res.json({
      ...updated,
      requestedAt: updated.requestedAt.toISOString(),
      approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
      generatedAt: updated.generatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
