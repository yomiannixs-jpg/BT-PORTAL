import { useState, useEffect } from "react";
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
import { useAuth } from "@/lib/auth-context";
import {
  Users, BookOpen, Bell, BarChart2, Plus, TrendingUp,
  FileText, MessageSquare, Reply, Send, CheckCheck,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "stats" | "students" | "courses" | "announcements" | "transcripts" | "messages";

const STATUS_OPTIONS = ["pending", "active", "graduated", "withdrawn"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  graduated: "bg-blue-50 text-blue-700 border-blue-200",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const CHART_COLORS = ["#F59E0B", "#1E3A5F", "#10B981", "#8B5CF6", "#EF4444"];

interface TranscriptRequest {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  programName: string;
  purpose: string;
  status: string;
  requestedAt: string;
  generatedAt: string;
}

interface Message {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  body: string;
  fromAdmin: boolean;
  parentId: number | null;
  isRead: boolean;
  createdAt: string;
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>("stats");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const qc = useQueryClient();
  const { token } = useAuth();

  // Transcripts state
  const [transcripts, setTranscripts] = useState<TranscriptRequest[]>([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

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

  const fetchTranscripts = async () => {
    setTranscriptsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/transcripts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTranscripts(await res.json());
    } finally {
      setTranscriptsLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${BASE}/api/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllMessages(data);
        setMessages(data.filter((m: Message) => !m.parentId));
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "transcripts" && token) fetchTranscripts();
    if (tab === "messages" && token) fetchMessages();
  }, [tab, token]);

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

  const sendReply = async () => {
    if (!selectedMsg || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${BASE}/api/students/${selectedMsg.studentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: `Re: ${selectedMsg.subject}`,
          body: replyBody,
          parentId: selectedMsg.parentId ?? selectedMsg.id,
        }),
      });
      if (res.ok) {
        setReplyBody("");
        await fetchMessages();
      }
    } finally {
      setSendingReply(false);
    }
  };

  const getReplies = (id: number) => allMessages.filter((m) => m.parentId === id);
  const unreadCount = messages.filter(m => !m.isRead && !m.fromAdmin).length;

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "stats", label: "Overview", icon: BarChart2 },
    { id: "students", label: "Students", icon: Users, count: students?.length },
    { id: "courses", label: "Courses", icon: BookOpen, count: courses?.length },
    { id: "announcements", label: "Announcements", icon: Bell, count: announcements?.length },
    { id: "transcripts", label: "Transcripts", icon: FileText, count: transcripts.length > 0 ? transcripts.length : undefined },
    { id: "messages", label: "Messages", icon: MessageSquare, count: unreadCount > 0 ? unreadCount : undefined },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage students, courses, transcripts, and communications</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-0 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                  t.id === "messages" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>{t.count}</span>
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
                <FField label="Title"><input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="Course title" /></FField>
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

      {/* Transcripts */}
      {tab === "transcripts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{transcripts.length} transcript copies generated</p>
            <button
              onClick={fetchTranscripts}
              className="text-xs text-accent hover:underline"
            >
              Refresh
            </button>
          </div>
          {transcriptsLoading ? (
            <div className="p-8 text-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : transcripts.length === 0 ? (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No transcript requests yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">When students generate transcripts, they appear here</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Program</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Purpose</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requested</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doc ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transcripts.map(t => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {t.firstName?.[0]}{t.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t.firstName} {t.lastName}</p>
                            <p className="text-xs text-muted-foreground">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground text-xs">{t.programName ?? "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                          {t.purpose?.replace("_", " ") ?? "personal"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-muted-foreground">
                        {new Date(t.requestedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-center text-xs font-mono text-muted-foreground">
                        BTI-{String(t.studentId).padStart(4, "0")}-{new Date(t.requestedAt).getFullYear()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {tab === "messages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Thread list */}
          <div className="lg:col-span-1 bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{messages.length} threads</p>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full font-semibold">{unreadCount} new</span>
              )}
            </div>
            {messagesLoading ? (
              <div className="p-6 text-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 text-center gap-2">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <p className="text-sm">No messages</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {messages.map(m => {
                  const isSelected = selectedMsg?.id === m.id;
                  const isUnread = !m.isRead && !m.fromAdmin;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMsg(m)}
                      className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {m.firstName?.[0]}
                        </div>
                        <p className={`text-sm truncate ${isUnread ? "font-bold" : "font-medium"}`}>
                          {m.firstName} {m.lastName}
                        </p>
                        {isUnread && <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate ml-8">{m.subject}</p>
                      <p className="text-xs text-muted-foreground/60 ml-8 mt-0.5">{new Date(m.createdAt).toLocaleDateString()}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thread detail + reply */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-card-border shadow-sm overflow-hidden flex flex-col">
            {!selectedMsg ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                <MessageSquare className="w-10 h-10 opacity-30" />
                <p className="text-sm">Select a message to view and reply</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-card-border">
                  <p className="font-bold text-foreground">{selectedMsg.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From: {selectedMsg.firstName} {selectedMsg.lastName} ({selectedMsg.email})
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0" style={{ maxHeight: "320px" }}>
                  {[selectedMsg, ...getReplies(selectedMsg.id)].map(m => (
                    <div key={m.id} className={`flex gap-3 ${m.fromAdmin ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        m.fromAdmin ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {m.fromAdmin ? "A" : (m.firstName?.[0] ?? "S")}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${m.fromAdmin ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm ${
                          m.fromAdmin
                            ? "bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm"
                            : "bg-muted border border-border text-foreground rounded-tl-sm"
                        }`}>
                          {m.body}
                        </div>
                        <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${m.fromAdmin ? "flex-row-reverse" : ""}`}>
                          <span>{m.fromAdmin ? "Admin (You)" : `${m.firstName} ${m.lastName}`}</span>
                          <span>·</span>
                          <span>{new Date(m.createdAt).toLocaleString()}</span>
                          {m.isRead && m.fromAdmin && <CheckCheck className="w-3 h-3 text-accent" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-card-border p-4">
                  <div className="flex gap-3">
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sendingReply || !replyBody.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex-shrink-0 self-end"
                    >
                      <Send className="w-4 h-4" />
                      {sendingReply ? "..." : "Reply"}
                    </button>
                  </div>
                </div>
              </>
            )}
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
