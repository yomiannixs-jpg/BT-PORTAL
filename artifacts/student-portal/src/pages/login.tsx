import { useState, useEffect } from "react";
import { GraduationCap, Eye, EyeOff, Shield, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Tab = "student" | "admin";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const demoCredentials = {
  student: [
    { label: "Amara Mensah", email: "amara.mensah@example.com", password: "student1" },
    { label: "Fatima Ibrahim", email: "fatima.ibrahim@example.com", password: "student2" },
    { label: "Khoury Benaissa", email: "khoury.benaissa@example.com", password: "student3" },
  ],
  admin: [
    { label: "Portal Admin", email: "admin@baumtenpers.com", password: "admin123" },
  ],
};

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = `${BASE}/dashboard`;
    }
  }, [user, isLoading]);

  const goToDashboard = () => {
    window.location.href = `${BASE}/dashboard`;
  };

  const goToOnboarding = () => {
    window.location.href = `${BASE}/onboarding`;
  };

  const fillAndSubmit = async (cred: { email: string; password: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
    setLoading(true);
    const result = await login(cred.email, cred.password);
    setLoading(false);
    if (result.success) {
      window.location.href = `${BASE}/dashboard`;
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      window.location.href = `${BASE}/dashboard`;
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sidebar via-[hsl(222,47%,16%)] to-[hsl(222,47%,20%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sidebar via-[hsl(222,47%,16%)] to-[hsl(222,47%,20%)] flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <p className="text-lg font-semibold">Welcome back, {user.name.split(" ")[0]}!</p>
          <button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-bold hover:opacity-90 transition-opacity mx-auto"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar via-[hsl(222,47%,16%)] to-[hsl(222,47%,20%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4 shadow-xl">
            <GraduationCap className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white">Academic Portal</h1>
          <p className="text-white/50 text-sm mt-1">BAUM TenPers Institute · Premiere Research Academy</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl border border-card-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-card-border">
            <button
              onClick={() => { setTab("student"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                tab === "student"
                  ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" /> Student Login
            </button>
            <button
              onClick={() => { setTab("admin"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${
                tab === "admin"
                  ? "bg-accent/5 text-accent border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" /> Admin Login
            </button>
          </div>

          <div className="p-8">
            {/* One-click demo access */}
            <div className="mb-6 p-4 bg-muted/40 rounded-xl border border-border">
              <p className="text-xs font-bold text-foreground/70 uppercase tracking-wide mb-3">
                ⚡ One-click demo access
              </p>
              <div className="flex flex-col gap-2">
                {demoCredentials[tab].map(cred => (
                  <button
                    key={cred.email}
                    onClick={() => fillAndSubmit(cred)}
                    disabled={loading}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-background hover:bg-accent/5 border border-border transition-colors text-left disabled:opacity-50 group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cred.label}</p>
                      <p className="text-xs text-muted-foreground">{cred.email}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">or enter credentials</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={tab === "admin" ? "admin@baumtenpers.com" : "your@email.com"}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  tab === "admin"
                    ? "bg-accent text-accent-foreground hover:opacity-90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                  : `Sign in as ${tab === "admin" ? "Administrator" : "Student"}`
                }
              </button>
            </form>

            {tab === "student" && (
              <div className="mt-6 pt-5 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  New student?{" "}
                  <button
                    onClick={goToOnboarding}
                    className="text-accent hover:underline font-medium"
                  >
                    Register here
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © 2026 BAUM TenPers Institute · Premiere Research Academy
        </p>
      </div>
    </div>
  );
}
