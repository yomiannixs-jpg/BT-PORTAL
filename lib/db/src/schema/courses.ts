import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  programId: integer("program_id").notNull(),
  instructorName: text("instructor_name").notNull(),
  credits: integer("credits").notNull().default(3),
  status: text("status").notNull().default("active"),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
