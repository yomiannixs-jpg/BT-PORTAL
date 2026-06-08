import { useState, useEffect } from "react";
import {
  useGetStudent,
  useListPrograms,
  useUpdateStudent,
  getGetStudentQueryKey,
  getListProgramsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudent } from "@/lib/student-context";
import { User, Save, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const { studentId } = useStudent();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: student, isLoading } = useGetStudent(
    studentId ?? 1,
    { query: { enabled: true, queryKey: getGetStudentQueryKey(studentId ?? 1) } }
  );
  const { data: programs } = useListPrograms({ query: { queryKey: getListProgramsQueryKey() } });
  const updateMutation = useUpdateStudent();

  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", country: "", bio: "", programId: 0 });

  useEffect(() => {
    if (student) {
      setForm({
        firstName: student.firstName ?? "",
        lastName: student.lastName ?? "",
        phone: student.phone ?? "",
        country: student.country ?? "",
        bio: student.bio ?? "",
        programId: student.programId ?? 0,
      });
    }
  }, [student]);

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!studentId) return;
    updateMutation.mutate({
      id: studentId,
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        country: form.country || undefined,
        bio: form.bio || undefined,
        programId: form.programId || undefined,
      },
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
          {initials || <User className="w-7 h-7" />}
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{form.firstName} {form.lastName}</p>
          <p className="text-sm text-muted-foreground">{student?.email}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
            student?.status === "active" ? "bg-green-50 text-green-700" :
            student?.status === "pending" ? "bg-amber-50 text-amber-700" :
            "bg-muted text-muted-foreground"
          }`}>{student?.status}</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-foreground">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name">
            <input className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              value={form.firstName} onChange={e => set("firstName", e.target.value)} />
          </Field>
          <Field label="Last Name">
            <input className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              value={form.lastName} onChange={e => set("lastName", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+1 234 567 8900" />
          </Field>
          <Field label="Country">
            <input className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
              value={form.country} onChange={e => set("country", e.target.value)} placeholder="Nigeria" />
          </Field>
        </div>
        <Field label="Program">
          <select
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            value={form.programId}
            onChange={e => set("programId", Number(e.target.value))}
          >
            <option value={0}>No program selected</option>
            {programs?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Bio">
          <textarea
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
            rows={3}
            value={form.bio}
            onChange={e => set("bio", e.target.value)}
            placeholder="Your research interests and academic background..."
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Changes saved
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
