import { Router } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  coursesTable,
  programsTable,
  enrollmentsTable,
  assignmentsTable,
  submissionsTable,
  gradesTable,
} from "@workspace/db";
import { eq, sql, desc, inArray } from "drizzle-orm";
import {
  GetStudentDashboardParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [{ totalStudents }] = await db.select({ totalStudents: sql<number>`count(*)::int` }).from(studentsTable);
    const [{ activeStudents }] = await db.select({ activeStudents: sql<number>`count(*)::int` }).from(studentsTable).where(eq(studentsTable.status, "active"));
    const [{ totalCourses }] = await db.select({ totalCourses: sql<number>`count(*)::int` }).from(coursesTable);
    const [{ totalPrograms }] = await db.select({ totalPrograms: sql<number>`count(*)::int` }).from(programsTable);

    const allSubmissions = await db.select({ id: submissionsTable.id }).from(submissionsTable);
    const gradedIds = allSubmissions.length > 0
      ? await db.select({ submissionId: gradesTable.submissionId }).from(gradesTable)
      : [];
    const gradedSet = new Set(gradedIds.map(g => g.submissionId));
    const pendingSubmissions = allSubmissions.filter(s => !gradedSet.has(s.id)).length;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [{ recentEnrollments }] = await db.select({ recentEnrollments: sql<number>`count(*)::int` }).from(enrollmentsTable).where(sql`${enrollmentsTable.enrolledAt} >= ${sevenDaysAgo}`);

    const statusRows = await db
      .select({ status: studentsTable.status, count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .groupBy(studentsTable.status);

    const programRows = await db
      .select({ programId: studentsTable.programId, count: sql<number>`count(*)::int` })
      .from(studentsTable)
      .groupBy(studentsTable.programId);

    const programs = await db.select().from(programsTable);
    const programMap = new Map(programs.map(p => [p.id, p.name]));

    res.json({
      totalStudents,
      activeStudents,
      totalCourses,
      totalPrograms,
      pendingSubmissions,
      recentEnrollments,
      studentsByStatus: statusRows.map(r => ({ status: r.status, count: r.count })),
      enrollmentsByProgram: programRows.map(r => ({
        program: r.programId ? (programMap.get(r.programId) ?? "Unknown") : "None",
        count: r.count,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/student/:id", async (req, res) => {
  try {
    const { id } = GetStudentDashboardParams.parse({ id: Number(req.params.id) });

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
        status: studentsTable.status,
        bio: studentsTable.bio,
        createdAt: studentsTable.createdAt,
      })
      .from(studentsTable)
      .leftJoin(programsTable, eq(studentsTable.programId, programsTable.id))
      .where(eq(studentsTable.id, id));
    if (!studentRow) return res.status(404).json({ error: "Not found" });

    const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.studentId, id));
    const enrolledCourses = enrollments.length;
    const courseIds = enrollments.map(e => e.courseId);

    let upcomingAssignments = 0;
    let completedAssignments = 0;
    let recentGrades: any[] = [];
    let gpa: number | null = null;

    if (courseIds.length > 0) {
      const now = new Date();
      const assignments = await db.select().from(assignmentsTable).where(inArray(assignmentsTable.courseId, courseIds));
      const submissions = await db.select().from(submissionsTable).where(eq(submissionsTable.studentId, id));
      const submittedIds = new Set(submissions.map(s => s.assignmentId));

      upcomingAssignments = assignments.filter(a => a.dueDate > now && !submittedIds.has(a.id)).length;
      completedAssignments = submissions.length;

      if (submissions.length > 0) {
        const grades = await db.select().from(gradesTable)
          .where(inArray(gradesTable.submissionId, submissions.map(s => s.id)))
          .orderBy(desc(gradesTable.gradedAt))
          .limit(5);

        const enriched = await Promise.all(grades.map(async (g) => {
          const [sub] = await db.select().from(submissionsTable).where(eq(submissionsTable.id, g.submissionId));
          const [asg] = sub
            ? await db.select({
                id: assignmentsTable.id,
                title: assignmentsTable.title,
                maxScore: assignmentsTable.maxScore,
                courseTitle: coursesTable.title,
              }).from(assignmentsTable)
                .leftJoin(coursesTable, eq(assignmentsTable.courseId, coursesTable.id))
                .where(eq(assignmentsTable.id, sub.assignmentId))
            : [];
          return {
            ...g,
            assignmentId: sub?.assignmentId ?? null,
            assignmentTitle: asg?.title ?? null,
            courseTitle: asg?.courseTitle ?? null,
            maxScore: asg?.maxScore ?? 100,
            gradedAt: g.gradedAt.toISOString(),
          };
        }));
        recentGrades = enriched;

        const allGrades = await db.select().from(gradesTable)
          .where(inArray(gradesTable.submissionId, submissions.map(s => s.id)));
        if (allGrades.length > 0) {
          const gradePoints: Record<string, number> = {
            "A+": 4.0, "A": 4.0, "A-": 3.7,
            "B+": 3.3, "B": 3.0, "B-": 2.7,
            "C+": 2.3, "C": 2.0, "C-": 1.7,
            "D": 1.0, "F": 0.0,
          };
          const points = allGrades.map(g => gradePoints[g.letterGrade] ?? 0);
          gpa = Math.round((points.reduce((a, b) => a + b, 0) / points.length) * 100) / 100;
        }
      }
    }

    res.json({
      student: { ...studentRow, createdAt: studentRow.createdAt.toISOString() },
      enrolledCourses,
      upcomingAssignments,
      completedAssignments,
      recentGrades,
      gpa,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
