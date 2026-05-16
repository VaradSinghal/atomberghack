import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { Target, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      const routes = { EMPLOYEE: "/goals", MANAGER: "/team", ADMIN: "/admin/cycles" };
      navigate(routes[user.role] || "/goals");
    } catch (err) {
      setError(err.message);
    }
  };

  const demoAccounts = [
    { email: "alice@company.com", role: "Employee", color: "bg-[var(--color-primary)]" },
    { email: "bob@company.com", role: "Manager", color: "bg-[var(--color-brand-secure)]" },
    { email: "carol@company.com", role: "Employee", color: "bg-[var(--color-primary-hover)]" },
    { email: "admin@company.com", role: "Admin", color: "bg-[var(--color-semantic-success)]" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] text-[var(--color-ink)] selection:bg-[var(--color-primary)] selection:text-white px-6">
      
      {/* Back button */}
      <button onClick={() => navigate("/")} className="absolute top-8 left-8 btn btn-secondary text-[var(--color-ink-muted)] border-none">
        ← Back to home
      </button>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-hairline-strong)] flex items-center justify-center mb-6">
            <Target className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <h1 className="display-md mb-2">Welcome back.</h1>
          <p className="body-lg text-[var(--color-ink-muted)]">Sign in to your GoalTrack workspace</p>
        </div>

        {error && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 rounded-xl text-sm mb-6 animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--color-surface-1)] border border-[var(--color-hairline)] p-8 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="form-group">
            <label className="form-label text-[var(--color-ink-muted)]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)]" />
              <input
                type="email"
                className="form-input pl-10 w-full"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="login-email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label text-[var(--color-ink-muted)]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-subtle)]" />
              <input
                type="password"
                className="form-input pl-10 w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="login-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 mt-2"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <span className="animate-pulse">Signing in...</span>
            ) : (
              <>Sign in <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-[var(--color-hairline)] flex-1"></div>
            <p className="text-[11px] font-medium text-[var(--color-ink-tertiary)] uppercase tracking-widest">Demo accounts</p>
            <div className="h-px bg-[var(--color-hairline)] flex-1"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword("demo123"); }}
                className="flex flex-col items-start gap-1 p-3 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-hairline-strong)] transition-all text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${acc.color}`} />
                  <span className="text-xs font-semibold text-[var(--color-ink)]">{acc.role}</span>
                </div>
                <span className="text-[11px] text-[var(--color-ink-subtle)] font-mono">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
