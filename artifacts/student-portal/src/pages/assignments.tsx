import { useState } from "react";
import {
  useGetStudentAssignments,
  useSubmitAssignment,
  getGetStudentAssignmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudent } from "@/lib/student-context";
import { ClipboardList, Calendar, CheckCircle2, Clock, AlertCircle, Send } from "lucide-react";

export default function Assignments() {
  const { studentId } = useStudent();
  const qc = useQueryClient();
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted">("all");

  const { data: assignments, isLoading } = useGetStudentAssignments(
    studentId ?? 1,
    { query: { enabled: true, queryKey: getGetStudentAssignmentsQueryKey(studentId ?? 1) } }
  );
  const submitMutation = useSubmitAssignment();

  const handleSubmit = (assignmentId: number) => {
    if (!studentId) return;
    setSubmittingId(assignmentId);
    submitMutation.mutate(
      { id: assignmentId, data: { studentId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetStudentAssignmentsQueryKey(studentId) });
        },
        onSettled: () => setSubmittingId(null),
      }
    );
  };

  const now = new Date();
  const filtered = assignments?.filter(a => {
    if (filter === "pending") return !a.submitted;
    if (filter === "submitted") return a.submitted;
    return true;
  }) ?? [];

  const overdue = (a: { submitted: boolean; dueDate: string }) => !a.submitted && new Date(a.dueDate) < now;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">All assignments across your enrolled courses</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(["all", "pending", "submitted"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium transition-colors capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-card-border p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ClipboardList className="w-10 h-10 opacity-30" />
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOverdue = overdue(a);
            const dueDate = new Date(a.dueDate);
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div
                key={a.id}
                className={`bg-card rounded-xl border shadow-sm transition-shadow hover:shadow-md p-5 flex items-center gap-4 ${
                  isOverdue ? "border-destructive/30" : "border-card-border"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.submitted ? "bg-green-50" : isOverdue ? "bg-destructive/10" : "bg-primary/10"
                }`}>
                  {a.submitted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : isOverdue ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.courseTitle ?? "Unknown course"}</p>
                  {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.description}</p>}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    isOverdue ? "text-destructive" :
                    daysUntilDue <= 3 && !a.submitted ? "text-amber-600" : "text-muted-foreground"
                  }`}>
                    <Calendar className="w-3 h-3" />
                    {isOverdue ? "Overdue" :
                     a.submitted ? dueDate.toLocaleDateString() :
                     daysUntilDue === 0 ? "Due today" :
                     daysUntilDue === 1 ? "Due tomorrow" :
                     `${daysUntilDue}d left`}
                  </div>
                  <div className="text-xs text-muted-foreground">{a.maxScore} pts</div>
                  {a.submitted ? (
                    <div className="flex items-center gap-1">
                      {a.grade ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.grade.startsWith("A") ? "bg-green-50 text-green-700" :
                          a.grade.startsWith("B") ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>{a.grade} — {a.score}/{a.maxScore}</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Grading...
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubmit(a.id)}
                      disabled={submittingId === a.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {submittingId === a.id ? "Submitting..." : "Submit"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
