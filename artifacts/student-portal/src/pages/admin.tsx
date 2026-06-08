import { useState } from "react";
import {
  useListStudents,
  useListCourses,
  useListAnnouncements,
  useUpdateStudentStatus,
  useCreateCourse,
  useCreateAnnouncement,
  useListPrograms,
  useGetDashboardStats,
  getListStudentsQueryKey,
  getListCoursesQueryKey,
  getListAnnouncementsQueryKey,
  getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, BookOpen, Bell, BarChart2, Plus, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Tab = "stats" | "students" | "courses" | "announcements";

const STATUS_OPTIONS = ["pending", "active", "graduated", "withdrawn"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  graduated: "bg-blue-50 text-blue-700 border-blue-200",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const CHART_COLORS = ["#F59E0B", "#1E3A5F", "#10B981", "#8B5CF6", "#EF4444"];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const qc = useQueryClient();

  const { data: stats } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: students, isLoading: studentsLoading } = useListStudents({ query: { queryKey: getListStudentsQueryKey() } });
  const { data: courses } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });
  const { data: announcements } = useListAnnouncements({ query: { queryKey: getListAnnouncementsQueryKey() } });
  const { data: programs } = useListPrograms();

  const statusMutation = useUpdateStudentStatus();
  const createCourseMutation = useCreateCourse();
  const createAnnMutation = useCreateAnnouncement();

  const [courseForm, setCourseForm] = useState({ title: "", code: "", description: "", programId: 1, instructorName: "", credits: 3, status: "active" });
  const [annForm, setAnnForm] = useState({ title: "", content: "", priority: "normal" });

  const handleStatusChange = (studentId: number, status: string) => {
    statusMutation.mutate({ id: studentId, data: { status: status as any } }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListStudentsQueryKey() }),
    });
  };

  const handleCreateCourse = () => {
    createCourseMutation.mutate({ data: courseForm as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        setShowCourseForm(false);
        setCourseForm({ title: "", code: "", description: "", programId: 1, instructorName: "", credits: 3, status: "active" });
      },
    });
  };

  const handleCreateAnn = () => {
    createAnnMutation.mutate({ data: annForm as any }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        setShowAnnForm(false);
        setAnnForm({ title: "", content: "", priority: "normal" });
      },
    });
  };

  const tabs = [
    { id: "stats" as Tab, label: "Overview", icon: BarChart2 },
    { id: "students" as Tab, label: "Students", icon: Users, count: students?.length },
    { id: "courses" as Tab, label: "Courses", icon: BookOpen, count: courses?.length },
    { id: "announcements" as Tab, label: "Announcements", icon: Bell, count: announcements?.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage students, courses, and communications</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Students", value: stats.totalStudents, color: "text-primary" },
              { label: "Active Students", value: stats.activeStudents, color: "text-green-600" },
              { label: "Total Courses", value: stats.totalCourses, color: "text-accent" },
              { label: "Pending Reviews", value: stats.pendingSubmissions, color: "text-destructive" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-xl border border-card-border p-5 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Students by Status
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.studentsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status}: ${count}`}>
                    {stats.studentsByStatus?.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-5">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-accent" /> Enrollments by Program
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.enrollmentsByProgram}>
                  <XAxis dataKey="program" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Students */}
      {tab === "students" && (
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          {studentsLoading ? (
            <div className="p-8 text-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Program</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Country</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students?.map(s => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{s.programName ?? "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{s.country ?? "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] ?? ""}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <select
                          className="text-xs border border-input rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          value={s.status}
                          onChange={e => handleStatusChange(s.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!students || students.length === 0) && (
                <div className="py-12 text-center text-muted-foreground">No students registered yet</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Courses */}
      {tab === "courses" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCourseForm(!showCourseForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
          {showCourseForm && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-foreground">New Course</h3>
              <div className="grid grid-cols-2 gap-4">
                <FField label="Title"><input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="Microeconomic Theory I" /></FField>
                <FField label="Code"><input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.code} onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))} placeholder="ECO101" /></FField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FField label="Instructor"><input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.instructorName} onChange={e => setCourseForm(f => ({ ...f, instructorName: e.target.value }))} placeholder="Dr. Name" /></FField>
                <FField label="Credits"><input type="number" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.credits} onChange={e => setCourseForm(f => ({ ...f, credits: Number(e.target.value) }))} /></FField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FField label="Program">
                  <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.programId} onChange={e => setCourseForm(f => ({ ...f, programId: Number(e.target.value) }))}>
                    {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </FField>
                <FField label="Status">
                  <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option>
                  </select>
                </FField>
              </div>
              <FField label="Description"><textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={2} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} /></FField>
              <div className="flex gap-3">
                <button onClick={() => setShowCourseForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleCreateCourse} disabled={createCourseMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </button>
              </div>
            </div>
          )}
          <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Instructor</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Credits</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enrolled</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {courses?.map(c => (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4"><p className="font-medium text-foreground">{c.title}</p><p className="text-xs text-muted-foreground font-mono">{c.code}</p></td>
                    <td className="px-4 py-4 text-muted-foreground">{c.instructorName}</td>
                    <td className="px-4 py-4 text-center text-foreground">{c.credits}</td>
                    <td className="px-4 py-4 text-center text-foreground">{c.enrollmentCount ?? 0}</td>
                    <td className="px-4 py-4 text-center"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.status === "active" ? "bg-green-50 text-green-700 border-green-200" : c.status === "upcoming" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-muted text-muted-foreground border-border"}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!courses || courses.length === 0) && <div className="py-12 text-center text-muted-foreground">No courses yet</div>}
          </div>
        </div>
      )}

      {/* Announcements */}
      {tab === "announcements" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAnnForm(!showAnnForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          </div>
          {showAnnForm && (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-foreground">New Announcement</h3>
              <FField label="Title"><input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" /></FField>
              <FField label="Content"><textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" rows={4} value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement..." /></FField>
              <FField label="Priority">
                <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={annForm.priority} onChange={e => setAnnForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option>
                </select>
              </FField>
              <div className="flex gap-3">
                <button onClick={() => setShowAnnForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
                <button onClick={handleCreateAnn} disabled={createAnnMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {createAnnMutation.isPending ? "Posting..." : "Post Announcement"}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {announcements?.map(a => (
              <div key={a.id} className="bg-card rounded-xl border border-card-border shadow-sm p-5 flex items-start gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  a.priority === "urgent" ? "bg-destructive text-white" :
                  a.priority === "important" ? "bg-accent text-accent-foreground" :
                  "bg-primary/10 text-primary"
                }`}>{a.priority}</span>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!announcements || announcements.length === 0) && <div className="py-12 text-center text-muted-foreground">No announcements yet</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
