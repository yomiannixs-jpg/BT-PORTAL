import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Eye, EyeOff, Shield, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Tab = "student" | "admin";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demoCredentials = {
    student: [
      { label: "Amara Mensah", email: "amara.mensah@example.com", password: "student1" },
      { label: "Fatima Ibrahim", email: "fatima.ibrahim@example.com", password: "student2" },
    ],
    admin: [
      { label: "Portal Admin", email: "admin@baumtenpers.com", password: "admin123" },
    ],
  };

  const fillDemo = (cred: { email: string; password: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error ?? "Login failed");
    }
  };

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
            {/* Demo credentials */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick demo access:</p>
              <div className="flex flex-wrap gap-2">
                {demoCredentials[tab].map(cred => (
                  <button
                    key={cred.email}
                    onClick={() => fillDemo(cred)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors"
                  >
                    {cred.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={tab === "admin" ? "admin@baumtenpers.com" : "student@university.edu"}
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
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                  tab === "admin"
                    ? "bg-accent text-accent-foreground hover:opacity-90"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {loading ? "Signing in..." : `Sign in as ${tab === "admin" ? "Administrator" : "Student"}`}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                New student?{" "}
                <button
                  onClick={() => navigate("/onboarding")}
                  className="text-accent hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © 2026 BAUM TenPers Institute · Premiere Research Academy
        </p>
      </div>
    </div>
  );
}
