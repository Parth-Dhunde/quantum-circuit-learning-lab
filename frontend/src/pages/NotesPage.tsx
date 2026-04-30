import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ModuleDemoPlayer } from "../components/ModuleDemoPlayer";
import { MiniQuiz } from "../components/MiniQuiz";
import { LEARNING_MODULES, type LearningModule } from "../data/learningModules";
import { useAuth } from "../auth/AuthProvider";
import { readUserProgress, writeUserProgress } from "../utils/userProgress";

type CompletionMethod = "quiz" | null;
type ProgressEntry = { status: boolean; method: CompletionMethod };
type ProgressState = Partial<Record<LearningModule["id"], ProgressEntry>>;

function normalizeProgress(raw: unknown): ProgressState {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const normalized: ProgressState = {};

  for (const module of LEARNING_MODULES) {
    const value = input[module.id];
    if (typeof value === "boolean") {
      normalized[module.id] = { status: value, method: null };
      continue;
    }
    if (value && typeof value === "object") {
      const entry = value as Record<string, unknown>;
      const status = Boolean(entry.status);
      const method = entry.method === "quiz" ? "quiz" : null;
      normalized[module.id] = { status, method };
    }
  }

  return normalized;
}

export function NotesPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState<LearningModule["id"]>(LEARNING_MODULES[0]!.id);
  const [completionFlash, setCompletionFlash] = useState<LearningModule["id"] | null>(null);
  const [quizResetVersion, setQuizResetVersion] = useState<Partial<Record<LearningModule["id"], number>>>({});
  const [progress, setProgress] = useState<ProgressState>({});

  useEffect(() => {
    if (!user?.uid) {
      setProgress({});
      setOpen(LEARNING_MODULES[0]!.id);
      return;
    }
    const persisted = readUserProgress(user.uid);
    setProgress(normalizeProgress(persisted.completedModules ?? {}));
    const savedLastModule = persisted.lastModule;
    if (savedLastModule && LEARNING_MODULES.some((m) => m.id === savedLastModule)) {
      setOpen(savedLastModule as LearningModule["id"]);
    } else {
      setOpen(LEARNING_MODULES[0]!.id);
    }
  }, [user?.uid]);

  const active = useMemo(() => LEARNING_MODULES.find((m) => m.id === open) ?? LEARNING_MODULES[0]!, [open]);
  const activeIndex = LEARNING_MODULES.findIndex((m) => m.id === active.id);
  const nextModule = activeIndex >= 0 && activeIndex < LEARNING_MODULES.length - 1 ? LEARNING_MODULES[activeIndex + 1] : null;
  const recommendedIndex = useMemo(
    () => LEARNING_MODULES.findIndex((m) => !progress[m.id]?.status),
    [progress],
  );
  const allCompleted = useMemo(
    () => LEARNING_MODULES.every((m) => progress[m.id]?.status === true),
    [progress],
  );

  const updateProgress = (updater: (prev: ProgressState) => ProgressState) => {
    setProgress((prev) => {
      const updated = updater(prev);
      if (user?.uid) {
        writeUserProgress(user.uid, {
          completedModules: updated as Record<string, { status: boolean; method: "quiz" | null }>,
        });
      }
      return updated;
    });
  };

  const completedCount = LEARNING_MODULES.reduce((acc, m) => acc + (progress[m.id]?.status ? 1 : 0), 0);
  const pct = Math.round((completedCount / LEARNING_MODULES.length) * 100);
  const activeCompleted = Boolean(progress[active.id]?.status);

  const setModuleCompletion = (moduleId: LearningModule["id"], status: boolean, method: CompletionMethod) => {
    updateProgress((prev) => ({
      ...prev,
      [moduleId]: { status, method: status ? method : null },
    }));
  };

  useEffect(() => {
    if (!user?.uid) return;
    writeUserProgress(user.uid, { lastModule: open });
  }, [open, user?.uid]);

  useEffect(() => {
    if (!completionFlash) return;
    const timer = window.setTimeout(() => setCompletionFlash(null), 1700);
    return () => window.clearTimeout(timer);
  }, [completionFlash]);

  const sidebarTopClass = "top-16";

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-10 lg:px-8 lg:py-16 xl:max-w-[1400px] 2xl:max-w-[1600px]">
      <header className="w-full space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-ds-accent dark:text-accent-glow">Notes</p>
        <h1 className="text-3xl font-semibold text-ds-primary sm:text-4xl">Learning modules</h1>
        <p className="text-sm leading-relaxed text-ds-secondary">
          Short explanations paired with an interactive demo circuit.
        </p>
      </header>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">Progress</p>
          <p className="text-xs text-ds-secondary">
            {completedCount}/{LEARNING_MODULES.length} completed ({pct}%)
          </p>
        </div>
        <div className="mt-3 h-2 rounded-full bg-ds-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-glow transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`glass-card p-4 lg:sticky ${sidebarTopClass} lg:h-[calc(100vh-4.5rem)] lg:overflow-y-auto`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-ds-muted">Topics</p>
          <div className="mt-3 flex flex-col gap-1">
            {LEARNING_MODULES.map((m, idx) => {
              const isRecommended = recommendedIndex >= 0 && idx === recommendedIndex;
              const isFuture = recommendedIndex >= 0 && idx > recommendedIndex;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setOpen(m.id)}
                  className={[
                    "rounded-lg px-3 py-2 text-left text-sm transition-[background-color,color] duration-200",
                    open === m.id
                      ? "bg-ds-surface text-ds-primary ring-1 ring-ds-line"
                      : "text-ds-secondary hover:bg-ds-surface",
                    isFuture ? "opacity-70" : "",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate">{m.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-ds-muted">{m.description}</span>
                      {isRecommended ? (
                        <span className="mt-1 inline-block rounded-full border border-ds-accent/40 px-2 py-0.5 text-[10px] font-semibold text-ds-accent">
                          Recommended next
                        </span>
                      ) : null}
                    </span>
                    {progress[m.id]?.status ? (
                      <span className="text-[11px] font-semibold text-ds-accent dark:text-accent-glow">Done</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-col gap-6">
          <div key={active.id} className="glass-card p-6 transition-[opacity,transform] duration-300 sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-ds-primary">{active.title}</h2>
                <p className="mt-1 text-sm text-ds-secondary">{active.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {progress[active.id]?.status ? (
                  <button
                    type="button"
                    className="btn-ghost px-4 py-2 text-sm"
                    onClick={() => {
                      setModuleCompletion(active.id, false, null);
                      setQuizResetVersion((prev) => ({ ...prev, [active.id]: (prev[active.id] ?? 0) + 1 }));
                    }}
                  >
                    Mark as not completed
                  </button>
                ) : null}
              </div>
            </div>

            <div
              className="mt-5 space-y-3 text-sm leading-relaxed text-ds-secondary transition-opacity duration-200"
            >
              {active.content.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          <div key={`${active.id}-demo`} className="w-full transition-[transform,opacity] duration-200">
            <ModuleDemoPlayer
              demoCircuit={active.demoCircuit}
              stepHints={active.stepHints}
              keyInsight={active.keyInsight}
            />
          </div>

          <div key={`${active.id}-quiz`} className="w-full transition-[transform,opacity] duration-200">
            <MiniQuiz
              moduleId={active.id}
              quiz={active.quiz}
              resetSignal={quizResetVersion[active.id] ?? 0}
              onAnswered={({ moduleId, correct }) => {
                if (correct) {
                  setModuleCompletion(moduleId, true, "quiz");
                  setCompletionFlash(moduleId);
                }
              }}
            />
          </div>

          <div className="h-5 w-full">
            <p
              className={[
                "text-center text-sm font-semibold text-ds-accent transition-all duration-300",
                completionFlash === active.id ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
              ].join(" ")}
              aria-live="polite"
            >
              ✅ Module completed
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (!nextModule) return;
                setOpen(nextModule.id);
              }}
              disabled={!nextModule}
              className={[
                "btn-ghost px-4 py-2 text-sm transition-[box-shadow,transform] duration-300 disabled:opacity-40",
                activeCompleted ? "shadow-[0_0_18px_rgba(56,189,248,0.35)] ring-1 ring-ds-accent/40" : "",
              ].join(" ")}
            >
              {nextModule ? `Next Module \u2192 ${nextModule.title}` : "All modules completed"}
            </button>
          </div>

          <p className="text-center text-[11px] text-ds-muted">
            Tip: To edit circuits, switch back to the Simulator. Modules are for reading and guided practice.
          </p>

          <div className="glass-card flex flex-col items-center gap-3 p-5 text-center">
            <p className="text-sm text-ds-secondary">Now try it yourself in Simulation. You will get the hang of it quickly.</p>
            <Link to="/simulation" state={{ fromNotes: true }} className="btn-accent px-5 py-2.5 text-sm">
              Open Simulation →
            </Link>
          </div>

          <div
            className={[
              "glass-card w-full p-6 text-center transition-all duration-300",
              allCompleted ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0",
            ].join(" ")}
          >
            <p className="text-lg font-semibold text-ds-primary">🎉 You&apos;ve completed the Quantum Basics Course!</p>
            <p className="mt-2 text-sm text-ds-secondary">
              Now try building your own circuits in Simulation.
            </p>
            <div className="mt-4">
              <Link to="/simulation" state={{ fromNotes: true }} className="btn-accent px-5 py-2.5 text-sm">
                Go to Simulation
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

