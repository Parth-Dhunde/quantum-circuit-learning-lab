import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { LEARNING_MODULES } from "../data/learningModules";
import { useQuizSession } from "../quiz/QuizSessionProvider";
import { resultMessage } from "../quiz/questionBank";

type Phase = "quiz" | "result";

export function QuizSessionPage() {
  const navigate = useNavigate();
  const { mode, questions, answers, answerQuestion, score, resetSession } = useQuizSession();
  const [phase, setPhase] = useState<Phase>("quiz");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  if (questions.length === 0) {
    return <Navigate to="/test" replace />;
  }

  const current = questions[index];
  if (!current) return <Navigate to="/test" replace />;

  const total = questions.length;
  const isLast = index === total - 1;
  const percent = Math.round((score / total) * 100);
  const correctNow = selected !== null && selected === current.correctIndex;

  const finish = () => {
    setPhase("result");
  };

  if (phase === "result") {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:max-w-[1400px] lg:px-8 lg:py-16 2xl:max-w-[1600px]">
        <div className="flex w-full flex-col gap-8 transition-all duration-300">
        <header className="w-full space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-ds-accent">Quiz</p>
          <h1 className="text-3xl font-semibold text-ds-primary sm:text-4xl">Assessment results</h1>
        </header>
        <section className="glass-card p-6 sm:p-8">
          <div className="panel-inset px-4 py-4">
            <p className="text-sm font-semibold text-ds-primary">Score: {score} / {total}</p>
            <p className="mt-2 text-sm text-ds-secondary">Percentage: {percent}%</p>
            <p className="mt-2 text-sm font-medium text-ds-primary">{resultMessage(percent)}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-accent px-5 py-2.5"
              onClick={() => {
                resetSession();
                navigate("/test");
              }}
            >
              Retry
            </button>
            <Link
              to="/test"
              className="btn-ghost px-5 py-2.5 text-center"
              onClick={() => {
                resetSession();
              }}
            >
              Back to Test
            </Link>
          </div>
        </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:max-w-[1400px] lg:px-8 lg:py-16 2xl:max-w-[1600px]">
      <div className="flex w-full flex-col gap-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-ds-muted">
          Question {index + 1} / {total}
        </p>
        <button type="button" className="btn-ghost px-4 py-2 text-xs" onClick={finish}>
          Exit
        </button>
      </div>

      <section className="glass-card min-h-[420px] p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-ds-primary">{current.question}</h1>
        <p className="mt-2 text-xs text-ds-secondary">
          Topic: {LEARNING_MODULES.find((m) => m.id === current.moduleId)?.title ?? "Unknown"}
        </p>

        <div className="mt-6 grid gap-3">
          {current.options.map((opt, i) => {
            const selectedNow = selected === i;
            const showCorrect = mode === "practice" && showFeedback && i === current.correctIndex;
            const showWrong = mode === "practice" && showFeedback && selectedNow && i !== current.correctIndex;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setSelected(i)}
                className={[
                  "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200",
                  selectedNow ? "border-ds-accent bg-ds-surface text-ds-primary" : "border-ds-line text-ds-secondary",
                  showCorrect ? "border-ds-accent bg-ds-surface text-ds-primary" : "",
                  showWrong ? "border-ds-danger-border bg-ds-danger-bg text-ds-danger" : "",
                ].join(" ")}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {mode === "practice" && showFeedback ? (
          <div className="mt-6 panel-inset px-4 py-3">
            <p className={["text-sm font-semibold", correctNow ? "text-ds-primary" : "text-ds-danger"].join(" ")}>
              {correctNow ? "Correct" : "Not quite"}
            </p>
            <p className="mt-2 text-sm text-ds-secondary">{current.explanation}</p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn-accent px-5 py-2.5"
            disabled={selected === null}
            onClick={() => {
              if (selected === null) return;
              answerQuestion(current.id, selected);
              if (mode === "practice" && !showFeedback) {
                setShowFeedback(true);
                return;
              }
              if (isLast) {
                finish();
                return;
              }
              setIndex((prev) => prev + 1);
              setSelected(null);
              setShowFeedback(false);
            }}
          >
            {mode === "practice"
              ? showFeedback
                ? isLast
                  ? "Finish"
                  : "Next"
                : "Check answer"
              : isLast
                ? "Submit"
                : "Next"}
          </button>
        </div>
      </section>
      </div>
    </div>
  );
}
