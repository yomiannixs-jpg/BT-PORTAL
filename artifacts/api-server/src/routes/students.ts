import { Router } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  programsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterStudentBody,
  UpdateStudentBody,
  UpdateStudentStatusBody,
  GetStudentParams,
  UpdateStudentParams,
  UpdateStudentStatusParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/students", async (req, res) => {
  try {
    const students = await db
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
      .leftJoin(programsTable, eq(studentsTable.programId, programsTable.id));
    res.json(students.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/students", async (req, res) => {
  try {
    const body = RegisterStudentBody.parse(req.body);
    const [student] = await db.insert(studentsTable).values({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone ?? null,
      country: body.country ?? null,
      programId: body.programId ?? null,
      bio: body.bio ?? null,
      status: "pending",
    }).returning();
    let programName: string | null = null;
    if (student.programId) {
      const [prog] = await db.select().from(programsTable).where(eq(programsTable.id, student.programId));
      programName = prog?.name ?? null;
    }
    res.status(201).json({ ...student, programName, createdAt: student.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.get("/students/:id", async (req, res) => {
  try {
    const { id } = GetStudentParams.parse({ id: Number(req.params.id) });
    const [student] = await db
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
    if (!student) return res.status(404).json({ error: "Not found" });
    res.json({ ...student, createdAt: student.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.patch("/students/:id", async (req, res) => {
  try {
    const { id } = UpdateStudentParams.parse({ id: Number(req.params.id) });
    const body = UpdateStudentBody.parse(req.body);
    const [updated] = await db.update(studentsTable).set({
      ...(body.firstName && { firstName: body.firstName }),
      ...(body.lastName && { lastName: body.lastName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.programId !== undefined && { programId: body.programId }),
      ...(body.bio !== undefined && { bio: body.bio }),
    }).where(eq(studentsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    let programName: string | null = null;
    if (updated.programId) {
      const [prog] = await db.select().from(programsTable).where(eq(programsTable.id, updated.programId));
      programName = prog?.name ?? null;
    }
    res.json({ ...updated, programName, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.patch("/students/:id/status", async (req, res) => {
  try {
    const { id } = UpdateStudentStatusParams.parse({ id: Number(req.params.id) });
    const body = UpdateStudentStatusBody.parse(req.body);
    const [updated] = await db.update(studentsTable).set({ status: body.status }).where(eq(studentsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    let programName: string | null = null;
    if (updated.programId) {
      const [prog] = await db.select().from(programsTable).where(eq(programsTable.id, updated.programId));
      programName = prog?.name ?? null;
    }
    res.json({ ...updated, programName, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
