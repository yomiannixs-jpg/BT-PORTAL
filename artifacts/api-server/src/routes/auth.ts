import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../middleware/auth";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role as "student" | "admin",
      name: user.name,
      studentId: user.studentId,
    };
    const token = signToken(authUser);
    res.json({ user: authUser, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, studentId } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: "student",
      studentId: studentId ?? null,
    }).returning();
    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role as "student" | "admin",
      name: user.name,
      studentId: user.studentId,
    };
    const token = signToken(authUser);
    res.status(201).json({ user: authUser, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const { id } = req.authUser!;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    let student = null;
    if (user.studentId) {
      const [s] = await db.select().from(studentsTable).where(eq(studentsTable.id, user.studentId));
      student = s ?? null;
    }
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: user.studentId,
      student: student ? {
        ...student,
        createdAt: student.createdAt.toISOString(),
      } : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.authUser!.id));
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(401).json({ error: "Current password incorrect" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
