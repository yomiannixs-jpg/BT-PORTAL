import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradesTable = pgTable("grades", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id").notNull().unique(),
  score: integer("score").notNull(),
  letterGrade: text("letter_grade").notNull(),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at").notNull().defaultNow(),
});

export const insertGradeSchema = createInsertSchema(gradesTable).omit({ id: true, gradedAt: true });
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof gradesTable.$inferSelect;
