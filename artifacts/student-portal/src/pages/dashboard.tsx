import { useStudent } from "@/lib/student-context";
import {
  useGetStudentDashboard,
  useListAnnouncements,
  getGetStudentDashboardQueryKey,
  getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { BookOpen, ClipboardList, Award, TrendingUp, Bell, Calendar, ChevronRight, AlertCircle } from "lucide-react";

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: any; sub?: string; color?: string }) {
  return (
    <div className="bg-card rounded-xl border border-card-border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color ?? "bg-primary/10"}`}>
          <Icon className={`w-5 h-5 ${color ? "text-white" : "text-primary"}`} />
        </div>
      </div>
    </div>
  );
}

const priorityConfig = {
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive border-destructive/20" },
  important: { label: "Important", className: "bg-accent/10 text-accent border-accent/20" },
  normal: { label: "Info", className: "bg-primary/10 text-primary border-primary/20" },
};

export default function Dashboard() {
  const { studentId } = useStudent();

  const { data: dashboard, isLoading } = useGetStudentDashboard(
    studentId ?? 1,
    { query: { enabled: true, queryKey: getGetStudentDashboardQueryKey(studentId ?? 1) } }
  );
  const { data: announcements } = useListAnnouncements(
    { query: { queryKey: getListAnnouncementsQueryKey() } }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <p className="text-muted-foreground">No student data found.</p>
        <Link href="/onboarding" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
          Register Now
        </Link>
      </div>
    );
  }

  const { student } = dashboard;
  const recentAnnouncements = announcements?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {student.firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {student.programName ?? "No program selected"} &middot; {student.country ?? ""}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${
          student.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
          student.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-muted text-muted-foreground border-border"
        }`}>
          {student.status}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled Courses" value={dashboard.enrolledCourses} icon={BookOpen} sub="active this term" color="bg-primary" />
        <StatCard label="Upcoming Tasks" value={dashboard.upcomingAssignments} icon={ClipboardList} sub="due soon" color="bg-amber-500" />
        <StatCard label="Completed" value={dashboard.completedAssignments} icon={Award} sub="submissions" color="bg-green-600" />
        <StatCard
          label="Current GPA"
          value={dashboard.gpa !== null && dashboard.gpa !== undefined ? dashboard.gpa.toFixed(2) : "—"}
          icon={TrendingUp}
          sub="cumulative"
          color="bg-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" /> Recent Grades
            </h2>
            <Link href="/grades" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {dashboard.recentGrades.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No grades yet</div>
            ) : (
              dashboard.recentGrades.map((grade) => (
                <div key={grade.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    grade.letterGrade?.startsWith("A") ? "bg-green-50 text-green-700" :
                    grade.letterGrade?.startsWith("B") ? "bg-blue-50 text-blue-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {grade.letterGrade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{grade.assignmentTitle ?? "Assignment"}</p>
                    <p className="text-xs text-muted-foreground truncate">{grade.courseTitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-foreground">{grade.score}/{grade.maxScore}</p>
                    <p className="text-xs text-muted-foreground">{Math.round((grade.score / grade.maxScore) * 100)}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" /> Announcements
            </h2>
            <Link href="/announcements" className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentAnnouncements.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No announcements</div>
            ) : (
              recentAnnouncements.map((ann) => {
                const cfg = priorityConfig[ann.priority as keyof typeof priorityConfig] ?? priorityConfig.normal;
                return (
                  <div key={ann.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-foreground leading-tight">{ann.title}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
