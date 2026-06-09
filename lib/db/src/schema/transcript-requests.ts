import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transcriptRequestsTable = pgTable("transcript_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  purpose: text("purpose").notNull().default("personal"),
  status: text("status").notNull().default("pending"), // pending | approved | denied
  paymentConfirmed: boolean("payment_confirmed").notNull().default(false),
  adminNotes: text("admin_notes"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertTranscriptRequestSchema = createInsertSchema(transcriptRequestsTable).omit({
  id: true,
  requestedAt: true,
  generatedAt: true,
  approvedAt: true,
});
export type InsertTranscriptRequest = z.infer<typeof insertTranscriptRequestSchema>;
export type TranscriptRequest = typeof transcriptRequestsTable.$inferSelect;
