import {
  useGetStudentGrades,
  getGetStudentGradesQueryKey,
} from "@workspace/api-client-react";
import { useStudent } from "@/lib/student-context";
import { Award, TrendingUp, BarChart2 } from "lucide-react";

const gradeColor = (grade: string) => {
  if (grade?.startsWith("A")) return "bg-green-50 text-green-700 border-green-200";
  if (grade?.startsWith("B")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (grade?.startsWith("C")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-destructive/10 text-destructive border-destructive/20";
};

const gradePoints: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
};

export default function Grades() {
  const { studentId } = useStudent();
  const { data: grades, isLoading } = useGetStudentGrades(
    studentId ?? 1,
    { query: { enabled: true, queryKey: getGetStudentGradesQueryKey(studentId ?? 1) } }
  );

  const gpa = grades && grades.length > 0
    ? (grades.reduce((sum, g) => sum + (gradePoints[g.letterGrade] ?? 0), 0) / grades.length).toFixed(2)
    : null;

  const avgScore = grades && grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grade Transcript</h1>
        <p className="text-sm text-muted-foreground mt-1">Your academic performance record</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm text-center">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">{gpa ?? "—"}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Cumulative GPA</p>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm text-center">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{grades?.length ?? 0}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Graded Assignments</p>
        </div>
        <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm text-center">
          <div className="w-10 h-10 bg-green-600/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <BarChart2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-foreground">{avgScore !== null ? `${avgScore}%` : "—"}</p>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">Average Score</p>
        </div>
      </div>

      {/* Transcript table */}
      <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-card-border">
          <h2 className="font-bold text-foreground">Grade Records</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : !grades || grades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Award className="w-10 h-10 opacity-30" />
            <p>No grades recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assignment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Score</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grade</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">GPA Points</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grades.map(g => (
                  <tr key={g.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{g.assignmentTitle ?? "Assignment"}</p>
                      {g.feedback && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">{g.feedback}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{g.courseTitle ?? "—"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-semibold text-foreground">{g.score}</span>
                      <span className="text-muted-foreground">/{g.maxScore}</span>
                      <div className="mt-1 h-1.5 w-16 mx-auto bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.round((g.score / g.maxScore) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block font-bold text-sm px-2.5 py-1 rounded-lg border ${gradeColor(g.letterGrade)}`}>
                        {g.letterGrade}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      {gradePoints[g.letterGrade]?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {new Date(g.gradedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
