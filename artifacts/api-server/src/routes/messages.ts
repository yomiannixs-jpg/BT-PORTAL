import { Router } from "express";
import { db } from "@workspace/db";
import { messagesTable, studentsTable } from "@workspace/db";
import { eq, desc, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/students/:id/messages", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const threads = await db.select().from(messagesTable)
      .where(eq(messagesTable.studentId, studentId))
      .orderBy(desc(messagesTable.createdAt));
    res.json(threads.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/students/:id/messages", requireAuth, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const { subject, body, parentId } = req.body;
    if (!body?.trim()) {
      res.status(400).json({ error: "Message body required" });
      return;
    }
    const [message] = await db.insert(messagesTable).values({
      studentId,
      subject: subject ?? "New Message",
      body,
      fromAdmin: req.authUser?.role === "admin",
      parentId: parentId ?? null,
      isRead: false,
    }).returning();
    res.status(201).json({ ...message, createdAt: message.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

router.patch("/messages/:id/read", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/messages", requireAuth, async (req, res) => {
  try {
    if (req.authUser?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const messages = await db
      .select({
        id: messagesTable.id,
        studentId: messagesTable.studentId,
        firstName: studentsTable.firstName,
        lastName: studentsTable.lastName,
        email: studentsTable.email,
        subject: messagesTable.subject,
        body: messagesTable.body,
        fromAdmin: messagesTable.fromAdmin,
        parentId: messagesTable.parentId,
        isRead: messagesTable.isRead,
        createdAt: messagesTable.createdAt,
      })
      .from(messagesTable)
      .leftJoin(studentsTable, eq(messagesTable.studentId, studentsTable.id))
      .orderBy(desc(messagesTable.createdAt));
    res.json(messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
