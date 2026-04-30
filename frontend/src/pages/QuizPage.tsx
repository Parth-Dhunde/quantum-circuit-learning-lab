import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LEARNING_MODULES, type LearningModule } from "../data/learningModules";
import { useQuizSession } from "../quiz/QuizSessionProvider";
import type { QuizMode } from "../quiz/questionBank";

export function QuizPage() {
  const navigate = useNavigate();
  const { startSession, resetSession } = useQuizSession();
  const [mode, setMode] = useState<QuizMode>("practice");
  const [selectedModules, setSelectedModules] = useState<LearningModule["id"][]>([]);
  const [startingSession, setStartingSession] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const allTopicIds = useMemo(() => LEARNING_MODULES.map((m) => m.id), []);
  const allSelected = selectedModules.length === 0 || selectedModules.length === LEARNING_MODULES.length;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:max-w-[1400px] lg:px-8 lg:py-16 2xl:max-w-[1600px]">
      <div className="flex w-full flex-col gap-8 transition-all duration-300">
      <header className="w-full space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-ds-accent dark:text-accent-glow">Quiz</p>
        <h1 className="text-3xl font-semibold text-ds-primary sm:text-4xl">Set up your test session</h1>
        <p className="text-sm leading-relaxed text-ds-secondary">Choose topics and mode, then start when you are ready.</p>
      </header>

      <section className="glass-card min-h-[420px] p-4 transition-all duration-300 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 text-xs text-ds-secondary">
            Mode
            <div className="panel-inset inline-flex w-fit p-1">
              <button
                type="button"
                className={["rounded-md px-4 py-2 text-xs", mode === "practice" ? "btn-accent" : "text-ds-secondary"].join(" ")}
                onClick={() => setMode("practice")}
              >
                Practice
              </button>
              <button
                type="button"
                className={["rounded-md px-4 py-2 text-xs", mode === "test" ? "btn-accent" : "text-ds-secondary"].join(" ")}
                onClick={() => setMode("test")}
              >
                Test
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-ds-secondary">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ds-primary">Select Topics</p>
              <div className="flex items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => setSelectedModules((prev) => (prev.length === LEARNING_MODULES.length ? [] : allTopicIds))}
                  />
                  <span>Select All</span>
                </label>
                <button
                  type="button"
                  className="text-ds-accent hover:underline"
                  onClick={() => setSelectedModules([])}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="light-panel p-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {LEARNING_MODULES.map((module) => {
                  const checked = selectedModules.includes(module.id);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      className={[
                        "flex items-center justify-between rounded-lg border border-ds-line px-3 py-2 text-sm transition hover:bg-ds-accent/10",
                        checked ? "border-ds-accent bg-ds-accent/15" : "bg-ds-surface",
                      ].join(" ")}
                      onClick={() =>
                        setSelectedModules((prev) =>
                          checked ? prev.filter((id) => id !== module.id) : [...prev, module.id],
                        )
                      }
                    >
                      <span className="truncate pr-2 text-xs text-ds-primary">{module.title}</span>
                      <input type="checkbox" checked={checked} readOnly />
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-ds-muted">Selecting none or all includes all topics.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="btn-accent px-6 py-2.5"
            disabled={startingSession}
            onClick={() => {
              setStartingSession(true);
              setStartError(null);
              resetSession();
              const started = startSession({ mode, selectedTopics: allSelected ? [] : selectedModules });
              if (!started) {
                setStartError("No questions available for the selected topics.");
                setStartingSession(false);
                return;
              }
              navigate("/test/session");
            }}
          >
            {startingSession ? "Loading..." : "Start Test"}
          </button>
        </div>
        {startError ? <p className="mt-3 text-right text-xs text-ds-danger">{startError}</p> : null}
      </section>
      </div>
    </div>
  );
}

