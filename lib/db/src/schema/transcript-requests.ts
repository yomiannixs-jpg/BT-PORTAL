import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transcriptRequestsTable = pgTable("transcript_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  purpose: text("purpose").notNull().default("personal"),
  status: text("status").notNull().default("generated"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertTranscriptRequestSchema = createInsertSchema(transcriptRequestsTable).omit({ id: true, requestedAt: true, generatedAt: true });
export type InsertTranscriptRequest = z.infer<typeof insertTranscriptRequestSchema>;
export type TranscriptRequest = typeof transcriptRequestsTable.$inferSelect;
