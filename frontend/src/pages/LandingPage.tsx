import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

const QuantumBlochSphere = lazy(() => import("../components/ui/QuantumBlochSphere"));

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-10 lg:px-8 lg:py-16 xl:max-w-[1400px] 2xl:max-w-[1600px]">
      <section className="glass-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.88] dark:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--mesh-1),_transparent_58%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--mesh-2),_transparent_52%)]" />
        </div>
        <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="w-full">
            <p className="text-xs uppercase tracking-[0.4em] text-ds-accent dark:text-accent-glow">
              Quantum Circuit Learning Lab
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-ds-primary sm:text-4xl lg:text-5xl">
              Quantum Circuit Learning Lab
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-ds-secondary sm:text-base">
              Build circuits, run simulations with Qiskit, and learn with guided notes and short quizzes you can finish in a few minutes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={user ? "/notes" : "/login"} className="btn-cyan px-6 py-3">
                Start Learning
              </Link>
              {user ? null : (
                <Link to="/signup" className="btn-ghost px-6 py-3">
                  Create Account
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center lg:justify-end">
            <Suspense
              fallback={
                <div className="h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(129,140,248,0.65),rgba(124,58,237,0.85))] sm:h-[240px] sm:w-[240px] lg:h-[280px] lg:w-[280px]" />
              }
            >
              <QuantumBlochSphere />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="glass-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-ds-accent">How it works</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { title: "Learn", body: "Go through guided modules with clear explanations and practice prompts you can try right away." },
            { title: "Simulate", body: "Build circuits visually and check statevector plus measurements in real time." },
            { title: "Test", body: "Pick topics, start a random quiz session, and get feedback as you go." },
          ].map((step) => (
            <div key={step.title} className="panel-inset p-4">
              <h2 className="text-lg font-semibold text-ds-primary">{step.title}</h2>
              <p className="mt-2 text-sm text-ds-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Interactive Simulator",
            body: "Place gates, run the circuit, and see counts, statevector, and the circuit diagram together.",
          },
          {
            title: "Guided Notes",
            body: "Course style lessons with progress tracking, so you always know what to learn next.",
          },
          {
            title: "Quiz System",
            body: "Answer multiple choice questions, get quick feedback, and track your score.",
          },
        ].map((f) => (
          <div key={f.title} className="glass-card p-6">
            <h2 className="text-lg font-semibold text-ds-primary">{f.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ds-secondary">{f.body}</p>
          </div>
        ))}
      </section>
      <footer className="glass-card text-center text-xs text-ds-muted p-5">
        <p className="font-semibold text-ds-primary">Built by Parth Dhunde</p>
        <p className="mt-1">If quantum feels confusing at first, that is normal. Keep going and it will start to click.</p>
      </footer>
    </div>
  );
}

