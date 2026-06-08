import { useState, useRef } from "react";
import { useStudent } from "@/lib/student-context";
import { useAuth } from "@/lib/auth-context";
import { Award, Download, Printer, FileText, CheckCircle2, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export default function Transcript() {
  const { studentId } = useStudent();
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTranscript = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/api/students/${studentId}/transcript`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load transcript");
      const d = await res.json();
      setData(d);
    } catch {
      setError("Failed to load transcript. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestTranscript = async (purpose: string) => {
    setRequesting(true);
    try {
      await fetch(`${BASE}/api/students/${studentId}/transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purpose }),
      });
      setGenerated(true);
      await fetchTranscript();
    } catch {
      setError("Failed to generate transcript.");
    } finally {
      setRequesting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!data && !loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate your official academic transcript</p>
        </div>

        <div className="bg-card rounded-2xl border border-card-border shadow-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Request Official Transcript</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Your transcript will be watermarked with an official seal and logged in the registrar's system.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {["personal", "university_application", "employer"].map(purpose => (
              <button
                key={purpose}
                onClick={() => requestTranscript(purpose)}
                disabled={requesting}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 capitalize"
              >
                {purpose === "university_application" ? "University Application" :
                 purpose === "employer" ? "Employer Copy" : "Personal Copy"}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            onClick={fetchTranscript}
            disabled={loading}
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            View existing transcript →
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { student, enrollments, grades, gpa, totalCredits, generatedAt } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Controls - hidden on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Official Transcript</h1>
          {generated && (
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Transcript logged in registrar system
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setData(null); setGenerated(false); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4" /> New Request
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Transcript */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl border-2 border-border shadow-lg relative overflow-hidden print:shadow-none print:border-0 print:rounded-none"
        id="transcript-printable"
      >
        {/* Watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
          style={{ transform: "rotate(-35deg)" }}
        >
          <div className="text-center opacity-[0.07]">
            <div className="text-6xl font-black text-gray-900 leading-tight tracking-widest uppercase whitespace-nowrap">BAUM TenPers</div>
            <div className="text-3xl font-bold text-gray-900 leading-tight tracking-widest uppercase whitespace-nowrap">OFFICIAL COPY</div>
            <div className="text-2xl font-semibold text-gray-900 leading-tight tracking-wide whitespace-nowrap">Premiere Research Academy</div>
          </div>
        </div>

        {/* Repeated watermark pattern */}
        <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xs font-bold text-gray-400 opacity-[0.04] whitespace-nowrap uppercase tracking-widest"
              style={{
                top: `${(i % 4) * 25}%`,
                left: `${Math.floor(i / 4) * 33}%`,
                transform: "rotate(-35deg)",
              }}
            >
              BAUM TenPers · Official Transcript
            </div>
          ))}
        </div>

        <div className="relative z-20 p-8">
          {/* Header */}
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
          </div>

          {/* Student Info */}
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

          {/* Course Enrollment */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-2">
              Course Enrollment Record
            </h2>
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

          {/* Grades */}
          <div className="mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-300 pb-2">
              Academic Performance Record
            </h2>
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

          {/* GPA Summary */}
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

          {/* Official footer */}
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

      {/* Print styles */}
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

function TransRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-36 flex-shrink-0">{label}:</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  );
}
