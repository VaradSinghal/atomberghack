import { useNavigate } from "react-router-dom";
import { ArrowRight, Target, Activity, Users, FileText } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)] selection:bg-[var(--color-primary)] selection:text-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 h-14 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[var(--color-primary)]" />
          <span className="font-semibold text-sm tracking-tight text-[var(--color-ink)]">GoalTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/login")} className="btn btn-tertiary text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
            Sign in
          </button>
          <button onClick={() => navigate("/login")} className="btn btn-primary">
            Get started
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-hairline-strong)] bg-[var(--color-surface-1)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span className="text-xs font-medium text-[var(--color-ink-muted)]">GoalTrack 1.0 is now live</span>
          </div>
          <h1 className="display-xl mb-6 max-w-4xl mx-auto">
            Performance tracking, <br />
            engineered for speed.
          </h1>
          <p className="body-lg text-[var(--color-ink-muted)] max-w-2xl mx-auto mb-10">
            GoalTrack brings clarity to performance management. Set organizational goals, track quarterly achievements, and automate approvals without the usual enterprise friction.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/login")} className="btn btn-primary px-6 py-3 text-[15px]">
              Start tracking
            </button>
            <button className="btn btn-secondary px-6 py-3 text-[15px]">
              View documentation
            </button>
          </div>
        </section>

        {/* Product Screenshot / Hero Image */}
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <div className="product-panel p-2">
            {/* Fake browser chrome */}
            <div className="h-8 flex items-center px-4 border-b border-[var(--color-hairline)] bg-[var(--color-surface-2)] rounded-t-xl mb-0 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/50"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/50"></div>
            </div>
            {/* Dashboard Mockup */}
            <div className="bg-[var(--color-canvas)] rounded-b-xl border border-[var(--color-hairline)] p-8 aspect-video relative overflow-hidden flex flex-col gap-6">
              <div className="flex justify-between items-center border-b border-[var(--color-hairline)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center">A</div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)]">Alice Employee</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">Sales Department</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 rounded bg-[var(--color-surface-2)]"></div>
                  <div className="h-8 w-8 rounded bg-[var(--color-primary)]"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-lg bg-[var(--color-surface-1)] border border-[var(--color-hairline)] p-4 flex flex-col justify-between">
                    <div className="h-4 w-1/2 rounded bg-[var(--color-surface-3)]"></div>
                    <div className="h-2 w-full rounded bg-[var(--color-surface-3)]"></div>
                    <div className="flex justify-between">
                      <div className="h-3 w-1/4 rounded bg-[var(--color-surface-3)]"></div>
                      <div className="h-3 w-8 rounded bg-[var(--color-primary)]/50"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 max-w-6xl mx-auto border-t border-[var(--color-hairline)]">
          <div className="mb-16">
            <h2 className="display-lg mb-4">Built for focus.</h2>
            <p className="subhead text-[var(--color-ink-muted)] max-w-2xl">
              Everything you need to align your team's objectives, without the clutter of legacy HR software.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Precision Goals", desc: "Set exact targets with numeric, timeline, and zero-based unit measurements." },
              { icon: Activity, title: "Real-time Tracking", desc: "Quarterly check-ins map directly to end-of-year appraisals automatically." },
              { icon: Users, title: "Manager Approvals", desc: "One-click approval workflows with inline editing and feedback loops." }
            ].map((f, i) => (
              <div key={i} className="glass-card p-8 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-hairline-strong)] flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="card-title text-[var(--color-ink)]">{f.title}</h3>
                <p className="body-sm text-[var(--color-ink-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-hairline)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-[var(--color-ink-subtle)]" />
              <span className="font-medium text-sm text-[var(--color-ink-subtle)]">GoalTrack</span>
            </div>
            <p className="text-xs text-[var(--color-ink-tertiary)] max-w-xs">
              Designed for the AtomQuest Hackathon. A complete performance management portal built with React, Node.js, and Prisma.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-[var(--color-ink)] font-medium mb-1">Product</span>
              <a href="#" className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors">Features</a>
              <a href="#" className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors">Integrations</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[var(--color-ink)] font-medium mb-1">Company</span>
              <a href="#" className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors">About</a>
              <a href="#" className="text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
