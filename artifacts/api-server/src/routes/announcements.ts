import { Router } from "express";
import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { CreateAnnouncementBody } from "@workspace/api-zod";

const router = Router();

router.get("/announcements", async (req, res) => {
  try {
    const announcements = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
    res.json(announcements.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", async (req, res) => {
  try {
    const body = CreateAnnouncementBody.parse(req.body);
    const [announcement] = await db.insert(announcementsTable).values({
      title: body.title,
      content: body.content,
      priority: body.priority ?? "normal",
    }).returning();
    res.status(201).json({ ...announcement, createdAt: announcement.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Bad request" });
  }
});

export default router;
