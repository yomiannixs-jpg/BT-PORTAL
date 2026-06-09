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
  Lock, Unlock, XCircle, CheckCircle2, CreditCard,
  ClipboardCheck, AlertCircle, ChevronDown, ChevronUp,
  GraduationCap,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "stats" | "students" | "courses" | "announcements" | "transcripts" | "grades" | "messages";

const STATUS_OPTIONS = ["pending", "active", "graduated", "withdrawn"] as const;
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  graduated: "bg-blue-50 text-blue-700 border-blue-200",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const CHART_COLORS = ["#F59E0B", "#1E3A5F", "#10B981", "#8B5CF6", "#EF4444"];

const LETTER_GRADES = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

interface TranscriptRequest {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  programName: string;
  purpose: string;
  status: string;
  paymentConfirmed: boolean;
  adminNotes: string | null;
  requestedAt: string;
  approvedAt: string | null;
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string | null;
  submittedAt: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  assignmentTitle: string;
  assignmentMaxScore: number;
  courseTitle: string;
  courseCode: string;
  graded: boolean;
  score: number | null;
  letterGrade: string | null;
  feedback: string | null;
  gradedAt: string | null;
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
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [transcriptNotes, setTranscriptNotes] = useState<Record<number, string>>({});
  const [transcriptPayment, setTranscriptPayment] = useState<Record<number, boolean>>({});

  // Grades/Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeForm, setGradeForm] = useState<Record<number, { score: string; letterGrade: string; feedback: string }>>({});
  const [expandedSub, setExpandedSub] = useState<number | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

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

  const authH = { Authorization: `Bearer ${token}` };

  const fetchTranscripts = async () => {
    setTranscriptsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/transcripts`, { headers: authH });
      if (res.ok) setTranscripts(await res.json());
    } finally {
      setTranscriptsLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const res = await fetch(`${BASE}/api/admin/submissions`, { headers: authH });
      if (res.ok) setSubmissions(await res.json());
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${BASE}/api/messages`, { headers: authH });
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
    if (tab === "grades" && token) fetchSubmissions();
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

  const handleTranscriptAction = async (id: number, action: "approve" | "deny") => {
    setActioningId(id);
    try {
      await fetch(`${BASE}/api/transcripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authH },
        body: JSON.stringify({
          action,
          adminNotes: transcriptNotes[id] ?? null,
          paymentConfirmed: transcriptPayment[id] ?? false,
        }),
      });
      await fetchTranscripts();
    } finally {
      setActioningId(null);
    }
  };

  const handleSaveGrade = async (submissionId: number) => {
    const form = gradeForm[submissionId];
    if (!form?.score || !form?.letterGrade) return;
    setSavingGrade(true);
    try {
      const res = await fetch(`${BASE}/api/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authH },
        body: JSON.stringify({
          score: Number(form.score),
          letterGrade: form.letterGrade,
          feedback: form.feedback || null,
        }),
      });
      if (res.ok) {
        await fetchSubmissions();
        setExpandedSub(null);
        setGradeForm(f => { const n = { ...f }; delete n[submissionId]; return n; });
      }
    } finally {
      setSavingGrade(false);
    }
  };

  const initGradeForm = (sub: Submission) => {
    setGradeForm(f => ({
      ...f,
      [sub.id]: {
        score: sub.score !== null ? String(sub.score) : "",
        letterGrade: sub.letterGrade ?? "",
        feedback: sub.feedback ?? "",
      },
    }));
    setExpandedSub(expandedSub === sub.id ? null : sub.id);
  };

  const sendReply = async () => {
    if (!selectedMsg || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`${BASE}/api/students/${selectedMsg.studentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authH },
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
  const pendingTranscripts = transcripts.filter(t => t.status === "pending").length;
  const ungradedCount = submissions.filter(s => !s.graded).length;

  const tabs: { id: Tab; label: string; icon: any; count?: number; urgent?: boolean }[] = [
    { id: "stats", label: "Overview", icon: BarChart2 },
    { id: "students", label: "Students", icon: Users, count: students?.length },
    { id: "courses", label: "Courses", icon: BookOpen, count: courses?.length },
    { id: "announcements", label: "Announcements", icon: Bell, count: announcements?.length },
    { id: "transcripts", label: "Transcripts", icon: FileText, count: pendingTranscripts > 0 ? pendingTranscripts : undefined, urgent: pendingTranscripts > 0 },
    { id: "grades", label: "Grades", icon: GraduationCap, count: ungradedCount > 0 ? ungradedCount : undefined, urgent: ungradedCount > 0 },
    { id: "messages", label: "Messages", icon: MessageSquare, count: unreadCount > 0 ? unreadCount : undefined },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage students, courses, transcripts, grades, and communications</p>
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
                  t.urgent ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                }`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Overview ─────────────────────────────────────────────────────── */}
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

      {/* ─── Students ─────────────────────────────────────────────────────── */}
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
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] ?? ""}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
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

      {/* ─── Courses ──────────────────────────────────────────────────────── */}
      {tab === "courses" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCourseForm(!showCourseForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
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

      {/* ─── Announcements ────────────────────────────────────────────────── */}
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

      {/* ─── Transcripts ──────────────────────────────────────────────────── */}
      {tab === "transcripts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{transcripts.length} total requests</p>
              {pendingTranscripts > 0 && (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {pendingTranscripts} awaiting your review
                </p>
              )}
            </div>
            <button onClick={fetchTranscripts} className="text-xs text-accent hover:underline">Refresh</button>
          </div>

          {transcriptsLoading ? (
            <div className="p-8 text-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : transcripts.length === 0 ? (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No transcript requests yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Requests from students will appear here for review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map(t => {
                const isPending = t.status === "pending";
                const isApproved = t.status === "approved";
                const isDenied = t.status === "denied";
                const isActioning = actioningId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`bg-card rounded-xl border shadow-sm overflow-hidden ${
                      isPending ? "border-amber-200" : isApproved ? "border-green-200" : "border-border"
                    }`}
                  >
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {t.firstName?.[0]}{t.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{t.firstName} {t.lastName}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isPending ? "bg-amber-100 text-amber-700" :
                            isApproved ? "bg-green-100 text-green-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {isPending ? "Pending" : isApproved ? "Approved" : "Denied"}
                          </span>
                          {isApproved && t.paymentConfirmed && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5" /> Payment Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.email} · {t.programName ?? "—"}</p>
                      </div>
                      <div className="text-right flex-shrink-0 text-xs text-muted-foreground">
                        <p className="capitalize font-medium">{t.purpose?.replace(/_/g, " ")}</p>
                        <p>{new Date(t.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Pending action area */}
                    {isPending && (
                      <div className="px-5 pb-4 space-y-3 border-t border-amber-100 bg-amber-50/30">
                        <p className="text-xs font-bold text-amber-700 pt-3 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Action Required
                        </p>

                        {/* Payment confirmation checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={transcriptPayment[t.id] ?? false}
                            onChange={e => setTranscriptPayment(p => ({ ...p, [t.id]: e.target.checked }))}
                            className="w-4 h-4 rounded border-input accent-accent"
                          />
                          <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-accent" />
                            Payment received and confirmed
                          </span>
                        </label>

                        {/* Admin notes */}
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Admin Notes (optional)</label>
                          <textarea
                            value={transcriptNotes[t.id] ?? ""}
                            onChange={e => setTranscriptNotes(n => ({ ...n, [t.id]: e.target.value }))}
                            placeholder="Add notes for the student (shown on denial)..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTranscriptAction(t.id, "approve")}
                            disabled={isActioning || !transcriptPayment[t.id]}
                            title={!transcriptPayment[t.id] ? "Confirm payment first" : ""}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            {isActioning ? "Processing..." : "Approve & Unlock"}
                          </button>
                          <button
                            onClick={() => handleTranscriptAction(t.id, "deny")}
                            disabled={isActioning}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {isActioning ? "..." : "Deny"}
                          </button>
                        </div>
                        {!transcriptPayment[t.id] && (
                          <p className="text-xs text-amber-600">⚠ You must confirm payment before approving.</p>
                        )}
                      </div>
                    )}

                    {/* Approved / denied info */}
                    {(isApproved || isDenied) && (
                      <div className={`px-5 py-3 border-t text-xs flex items-center gap-3 ${isApproved ? "border-green-100 bg-green-50/30 text-green-700" : "border-red-100 bg-red-50/30 text-red-700"}`}>
                        {isApproved ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
                        <span className="font-semibold">{isApproved ? "Transcript unlocked" : "Request denied"}</span>
                        {t.approvedAt && <span className="text-muted-foreground">· {new Date(t.approvedAt).toLocaleDateString()}</span>}
                        {t.adminNotes && <span className="text-muted-foreground truncate">· {t.adminNotes}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Grades ───────────────────────────────────────────────────────── */}
      {tab === "grades" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{submissions.length} total submissions</p>
              {ungradedCount > 0 && (
                <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {ungradedCount} need grading
                </p>
              )}
            </div>
            <button onClick={fetchSubmissions} className="text-xs text-accent hover:underline">Refresh</button>
          </div>

          {submissionsLoading ? (
            <div className="p-8 text-center"><div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : submissions.length === 0 ? (
            <div className="bg-card rounded-xl border border-card-border shadow-sm p-12 text-center">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No submissions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Student submissions will appear here when they submit assignments</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map(sub => {
                const isExpanded = expandedSub === sub.id;
                const form = gradeForm[sub.id] ?? { score: "", letterGrade: "", feedback: "" };

                return (
                  <div key={sub.id} className={`bg-card rounded-xl border shadow-sm overflow-hidden transition-all ${sub.graded ? "border-card-border" : "border-amber-200"}`}>
                    {/* Row */}
                    <button
                      onClick={() => initGradeForm(sub)}
                      className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {sub.studentFirstName?.[0]}{sub.studentLastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{sub.studentFirstName} {sub.studentLastName}</p>
                          <span className="text-xs text-muted-foreground">·</span>
                          <p className="text-xs text-muted-foreground truncate">{sub.assignmentTitle}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{sub.courseCode} · {sub.courseTitle}</p>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-3">
                        {sub.graded ? (
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-sm font-black text-green-700">{sub.letterGrade}</span>
                              <span className="text-xs text-muted-foreground">{sub.score}/{sub.assignmentMaxScore}</span>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Graded</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Needs Grade</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Expanded grade form */}
                    {isExpanded && (
                      <div className="border-t border-border px-5 py-4 space-y-4 bg-muted/20">
                        {sub.content && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Submission Content</p>
                            <p className="text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2.5 whitespace-pre-wrap">{sub.content}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Score (out of {sub.assignmentMaxScore})</label>
                            <input
                              type="number"
                              min={0}
                              max={sub.assignmentMaxScore}
                              value={form.score}
                              onChange={e => setGradeForm(f => ({ ...f, [sub.id]: { ...form, score: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder={`0 – ${sub.assignmentMaxScore}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Letter Grade</label>
                            <select
                              value={form.letterGrade}
                              onChange={e => setGradeForm(f => ({ ...f, [sub.id]: { ...form, letterGrade: e.target.value } }))}
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="">Select grade</option>
                              {LETTER_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Feedback (optional)</label>
                          <textarea
                            value={form.feedback}
                            onChange={e => setGradeForm(f => ({ ...f, [sub.id]: { ...form, feedback: e.target.value } }))}
                            placeholder="Write feedback for the student..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSaveGrade(sub.id)}
                            disabled={savingGrade || !form.score || !form.letterGrade}
                            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {savingGrade ? "Saving..." : sub.graded ? "Update Grade" : "Save Grade"}
                          </button>
                          <button
                            onClick={() => setExpandedSub(null)}
                            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Messages ─────────────────────────────────────────────────────── */}
      {tab === "messages" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                    <button key={m.id} onClick={() => setSelectedMsg(m)}
                      className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{m.firstName?.[0]}</div>
                        <p className={`text-sm truncate ${isUnread ? "font-bold" : "font-medium"}`}>{m.firstName} {m.lastName}</p>
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
                  <p className="text-xs text-muted-foreground mt-0.5">From: {selectedMsg.firstName} {selectedMsg.lastName} ({selectedMsg.email})</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0" style={{ maxHeight: "320px" }}>
                  {[selectedMsg, ...getReplies(selectedMsg.id)].map(m => (
                    <div key={m.id} className={`flex gap-3 ${m.fromAdmin ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.fromAdmin ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
                        {m.fromAdmin ? "A" : (m.firstName?.[0] ?? "S")}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${m.fromAdmin ? "items-end" : "items-start"} flex flex-col`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm ${m.fromAdmin ? "bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm" : "bg-muted border border-border text-foreground rounded-tl-sm"}`}>
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
