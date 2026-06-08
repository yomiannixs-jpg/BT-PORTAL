import { useState } from "react";
import { useLocation } from "wouter";
import { useListPrograms, useRegisterStudent } from "@workspace/api-client-react";
import { GraduationCap, ChevronRight, ChevronLeft, Check, User, BookOpen, ClipboardCheck } from "lucide-react";
import { useStudent } from "@/lib/student-context";

const steps = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Program", icon: BookOpen },
  { id: 3, label: "Review", icon: ClipboardCheck },
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { setStudentId } = useStudent();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    bio: "",
    programId: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: programs } = useListPrograms();
  const registerMutation = useRegisterStudent();

  const set = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.programId) e.programId = "Please select a program";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  const submit = () => {
    registerMutation.mutate({
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        country: form.country || undefined,
        bio: form.bio || undefined,
        programId: form.programId || undefined,
      },
    }, {
      onSuccess: (student) => {
        setStudentId(student.id);
        navigate("/dashboard");
      },
    });
  };

  const selectedProgram = programs?.find(p => p.id === form.programId);
  const levelLabel: Record<string, string> = {
    certificate: "Certificate",
    masters: "Master's Level",
    phd_prep: "PhD Preparation",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-sidebar to-[hsl(222,47%,20%)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-xl">
            <GraduationCap className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Student Registration</h1>
          <p className="text-white/60 text-sm mt-1">BAUM TenPers Institute & Premiere Research Academy</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active ? "bg-accent text-accent-foreground" :
                  done ? "bg-white/20 text-white" : "bg-white/10 text-white/40"
                }`}>
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {s.label}
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-white/30" />}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl shadow-2xl border border-card-border p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground mb-6">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" error={errors.firstName}>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    placeholder="e.g. Amara"
                  />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    placeholder="e.g. Mensah"
                  />
                </Field>
              </div>
              <Field label="Email Address *" error={errors.email}>
                <input
                  type="email"
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                  value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="you@university.edu"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone">
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </Field>
                <Field label="Country">
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                    value={form.country} onChange={e => set("country", e.target.value)}
                    placeholder="Nigeria"
                  />
                </Field>
              </div>
              <Field label="Short Bio">
                <textarea
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition resize-none"
                  rows={3}
                  value={form.bio} onChange={e => set("bio", e.target.value)}
                  placeholder="Your research interests and academic background..."
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground mb-2">Select Your Program</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose the academic program that matches your goals.</p>
              {errors.programId && <p className="text-sm text-destructive">{errors.programId}</p>}
              <div className="space-y-3">
                {programs?.map(program => (
                  <button
                    key={program.id}
                    type="button"
                    onClick={() => set("programId", program.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      form.programId === program.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">{program.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{program.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {levelLabel[program.level] ?? program.level}
                        </span>
                        <span className="text-xs text-muted-foreground">{program.durationMonths}mo</span>
                      </div>
                    </div>
                    {form.programId === program.id && (
                      <div className="flex items-center gap-1 mt-2 text-accent text-xs font-semibold">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-foreground mb-2">Review Your Application</h2>
              <div className="space-y-3">
                <ReviewRow label="Full Name" value={`${form.firstName} ${form.lastName}`} />
                <ReviewRow label="Email" value={form.email} />
                {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                {form.country && <ReviewRow label="Country" value={form.country} />}
                {selectedProgram && <ReviewRow label="Program" value={selectedProgram.name} />}
                {form.bio && <ReviewRow label="Bio" value={form.bio} />}
              </div>
              {registerMutation.error && (
                <p className="text-sm text-destructive">Registration failed. Please try again.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={step < 3 ? next : submit}
              disabled={registerMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {registerMutation.isPending ? "Registering..." : step < 3 ? (
                <><span>Continue</span><ChevronRight className="w-4 h-4" /></>
              ) : (
                <><Check className="w-4 h-4" /><span>Complete Registration</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Already registered?{" "}
          <button onClick={() => navigate("/dashboard")} className="text-accent hover:underline">Go to dashboard</button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
