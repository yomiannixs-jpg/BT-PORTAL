import { useState, useRef, useEffect } from "react";
import { useStudent } from "@/lib/student-context";
import { useAuth } from "@/lib/auth-context";
import { apiPath } from "@/lib/api";
import {
  Award, Download, Printer, FileText, Lock, Clock, CheckCircle2,
  XCircle, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";


const gradePoints: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D": 1.0, "F": 0.0,
};

const levelLabel: Record<string, string> = {
  certificate: "Certificate Program",
  masters: "Master's Level",
  phd_prep: "PhD Preparation Program",
};

const gradeColor = (g: string) => {
  if (g?.startsWith("A")) return "text-green-700";
  if (g?.startsWith("B")) return "text-blue-700";
  if (g?.startsWith("C")) return "text-amber-700";
  return "text-red-700";
};

const PURPOSE_LABELS: Record<string, string> = {
  personal: "Personal Copy",
  university_application: "University Application",
  employer: "Employer / HR Copy",
  scholarship: "Scholarship Application",
};

interface RequestStatus {
  exists: boolean;
  status: "none" | "pending" | "approved" | "denied" | "generated";
  requestId: number | null;
  purpose?: string;
  paymentConfirmed?: boolean;
  adminNotes?: string | null;
  requestedAt?: string;
  approvedAt?: string | null;
}

export default function Transcript() {
  const { studentId } = useStudent();
  const { token } = useAuth();
  const [reqStatus, setReqStatus] = useState<RequestStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState("personal");
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const authHeaders = { Authorization: `Bearer ${token}` };

  const checkStatus = async () => {
    setCheckingStatus(true);
    setError("");
    try {
      const res = await fetch(apiPath(`/api/students/${studentId}/transcript/status`), { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setReqStatus(data);
        // If approved (or old "generated" status), load the transcript automatically
        if (data.status === "approved" || data.status === "generated") {
          await fetchTranscript();
        }
      }
    } catch {
      setError("Failed to check status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchTranscript = async () => {
    setLoadingTranscript(true);
    try {
      const res = await fetch(apiPath(`/api/students/${studentId}/transcript`), { headers: authHeaders });
      if (res.ok) {
        setTranscriptData(await res.json());
      }
    } catch {
      setError("Failed to load transcript.");
    } finally {
      setLoadingTranscript(false);
    }
  };

  const submitRequest = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(apiPath(`/api/students/${studentId}/transcript`), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ purpose: selectedPurpose }),
      });
      if (res.status === 409) {
        // Already has a request — re-check
        await checkStatus();
        return;
      }
      if (res.ok) {
        await checkStatus();
      } else {
        setError("Failed to submit request. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (studentId && token) checkStatus();
  }, [studentId, token]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  // ── Transcript viewer (approved) ───────────────────────────────────────────
  if (transcriptData) {
    const { student, enrollments, grades, gpa, totalCredits, generatedAt } = transcriptData;
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Access granted — transcript unlocked
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>

        <div
          ref={printRef}
          className="bg-white rounded-2xl border-2 border-border shadow-lg relative overflow-hidden print:shadow-none print:border-0 print:rounded-none"
          id="transcript-printable"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10" style={{ transform: "rotate(-35deg)" }}>
            <div className="text-center opacity-[0.07]">
              <div className="text-6xl font-black text-gray-900 leading-tight tracking-widest uppercase whitespace-nowrap">BAUM TenPers</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight tracking-widest uppercase whitespace-nowrap">OFFICIAL COPY</div>
              <div className="text-2xl font-semibold text-gray-900 leading-tight tracking-wide whitespace-nowrap">Premiere Research Academy</div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="absolute text-xs font-bold text-gray-400 opacity-[0.04] whitespace-nowrap uppercase tracking-widest"
                style={{ top: `${(i % 4) * 25}%`, left: `${Math.floor(i / 4) * 33}%`, transform: "rotate(-35deg)" }}>
                BAUM TenPers · Official Transcript
              </div>
            ))}
          </div>

          <div className="relative z-20 p-8">
            <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[hsl(222,47%,18%)] rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-wide uppercase">BAUM TenPers Institute</h1>
              <p className="text-sm font-semibold text-gray-600 mt-0.5">In Partnership with Premiere Research Academy</p>
              <div className="mt-4 inline-block bg-[hsl(222,47%,18%)] text-white px-6 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                Official Academic Transcript
              </div>
              <div className="mt-2 text-xs text-gray-500">Purpose: {PURPOSE_LABELS[transcriptData.purpose] ?? transcriptData.purpose}</div>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-8 text-sm">
              <TransRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
              <TransRow label="Student ID" value={`BTI-${String(student.id).padStart(6, "0")}`} />
              <TransRow label="Email" value={student.email} />
              <TransRow label="Country" value={student.country ?? "—"} />
              <TransRow label="Program" value={student.programName ?? "—"} />
              <TransRow label="Level" value={levelLabel[student.programLevel ?? ""] ?? student.programLevel ?? "—"} />
              <TransRow label="Enrollment Status" value={student.status?.toUpperCase()} />
              <TransRow label="Date of Issue" value={new Date(generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-2">Course Enrollment Record</h2>
              {enrollments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No course enrollments on record.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Code</th>
                      <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Course Title</th>
                      <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Instructor</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Credits</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{e.courseCode}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{e.courseTitle}</td>
                        <td className="px-3 py-2 text-gray-600">{e.instructorName}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{e.credits}</td>
                        <td className="px-3 py-2 text-center text-gray-500 text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-3 py-2 text-xs font-bold text-gray-700 text-right">Total Credits:</td>
                      <td className="px-3 py-2 text-center font-bold text-gray-900">{totalCredits}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-2">Academic Performance Record</h2>
              {grades.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No graded assessments on record.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Assignment</th>
                      <th className="text-left px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Course</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Score</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Grade</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">GPA Pts</th>
                      <th className="text-center px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g: any) => (
                      <tr key={g.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 font-medium text-gray-800">{g.assignmentTitle ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{g.courseTitle ?? "—"}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{g.score}/{g.maxScore}</td>
                        <td className={`px-3 py-2 text-center font-bold ${gradeColor(g.letterGrade)}`}>{g.letterGrade}</td>
                        <td className="px-3 py-2 text-center text-gray-700">{gradePoints[g.letterGrade]?.toFixed(1) ?? "—"}</td>
                        <td className="px-3 py-2 text-center text-gray-500 text-xs">{new Date(g.gradedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-[hsl(222,47%,18%)] text-white rounded-xl p-5 flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Cumulative GPA</p>
                <p className="text-4xl font-black text-amber-400 mt-1">{gpa !== null && gpa !== undefined ? gpa.toFixed(2) : "N/A"}</p>
                <p className="text-xs opacity-60 mt-1">on a 4.0 scale</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Total Credits</p>
                <p className="text-4xl font-black text-white mt-1">{totalCredits}</p>
                <p className="text-xs opacity-60 mt-1">credit hours</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Graded Items</p>
                <p className="text-4xl font-black text-white mt-1">{grades.length}</p>
                <p className="text-xs opacity-60 mt-1">assessments</p>
              </div>
            </div>

            <div className="border-t-2 border-gray-800 pt-6">
              <div className="grid grid-cols-3 gap-8 text-xs text-gray-600">
                <div>
                  <p className="font-bold text-gray-900 mb-1">CERTIFICATION</p>
                  <p>This is an official academic transcript issued by BAUM TenPers Institute in partnership with Premiere Research Academy.</p>
                </div>
                <div className="text-center">
                  <div className="mt-6 border-t border-gray-400 pt-2">
                    <p className="font-semibold text-gray-700">Registrar's Office</p>
                    <p>BAUM TenPers Institute</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 mb-1">VERIFICATION</p>
                  <p>Document ID: BTI-{String(student.id).padStart(4, "0")}-{new Date(generatedAt).getFullYear()}</p>
                  <p className="mt-1">Generated: {new Date(generatedAt).toLocaleDateString()}</p>
                  <p className="mt-1 font-semibold text-[hsl(222,47%,18%)]">⚠ Unauthorized duplication prohibited</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #transcript-printable, #transcript-printable * { visibility: visible; }
            #transcript-printable { position: fixed; left: 0; top: 0; width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // ── Loading transcript ─────────────────────────────────────────────────────
  if (loadingTranscript) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const status = reqStatus?.status ?? "none";

  // ── Pending ────────────────────────────────────────────────────────────────
  if (status === "pending") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">Transcript access is gated — admin approval required</p>
        </div>
        <div className="bg-card rounded-2xl border border-amber-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Request Submitted — Awaiting Approval</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Your transcript request has been received. The admin team will review it and grant access once payment is confirmed.
              </p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Purpose</span>
              <span className="font-semibold capitalize">{PURPOSE_LABELS[reqStatus?.purpose ?? ""] ?? reqStatus?.purpose ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Requested</span>
              <span className="font-semibold">{reqStatus?.requestedAt ? new Date(reqStatus.requestedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                <Clock className="w-3 h-3" /> Pending Review
              </span>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80">
            <p className="font-semibold text-foreground mb-1">💳 Payment Required</p>
            <p>To proceed, please complete the transcript fee payment via the institute's payment portal or contact the registrar's office. Once payment is confirmed, the admin will unlock your transcript access.</p>
          </div>

          <button
            onClick={checkStatus}
            className="flex items-center gap-2 text-xs text-accent hover:underline mx-auto"
          >
            <RefreshCw className="w-3 h-3" /> Refresh status
          </button>
        </div>
      </div>
    );
  }

  // ── Denied ─────────────────────────────────────────────────────────────────
  if (status === "denied") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">Transcript access is gated — admin approval required</p>
        </div>
        <div className="bg-card rounded-2xl border border-destructive/30 shadow-sm p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Request Denied</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Your transcript request was not approved. Please contact the registrar's office for more information.
              </p>
            </div>
          </div>

          {reqStatus?.adminNotes && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-sm">
              <p className="font-semibold text-foreground mb-1">Admin Notes</p>
              <p className="text-muted-foreground">{reqStatus.adminNotes}</p>
            </div>
          )}

          <button
            onClick={() => {
              setReqStatus(null);
            }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Submit a New Request
          </button>
        </div>
      </div>
    );
  }

  // ── No request yet ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
        <p className="text-sm text-muted-foreground mt-1">Request access — admin approval required after payment</p>
      </div>

      <div className="bg-card rounded-2xl border border-card-border shadow-sm p-8 space-y-6">
        {/* Lock icon */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative">
            <FileText className="w-8 h-8 text-primary" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Transcript Access is Locked</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your official transcript is securely locked. Submit a request and complete the transcript fee — admin will review and unlock access.
            </p>
          </div>
        </div>

        {/* Process steps */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          {[
            { step: "1", label: "Submit Request", desc: "Choose purpose below" },
            { step: "2", label: "Pay Fee", desc: "Contact registrar or pay online" },
            { step: "3", label: "Get Access", desc: "Admin unlocks your transcript" },
          ].map(s => (
            <div key={s.step} className="bg-muted/40 rounded-xl p-3 space-y-1">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center mx-auto">{s.step}</div>
              <p className="font-semibold text-foreground">{s.label}</p>
              <p className="text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Purpose selection */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-foreground/70 uppercase tracking-wide">Select Purpose</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSelectedPurpose(value)}
                className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                  selectedPurpose === value
                    ? "border-primary bg-primary/5 text-primary font-semibold"
                    : "border-border hover:border-primary/40 text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={submitRequest}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Transcript Request"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          After submitting, contact the registrar's office to complete payment. Your request will be reviewed within 1–3 business days.
        </p>
      </div>
    </div>
  );
}

function TransRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-36 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}
