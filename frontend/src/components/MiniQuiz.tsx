import { useEffect, useMemo, useState } from "react";

import type { LearningModule } from "../data/learningModules";

type Props = {
  moduleId: LearningModule["id"];
  quiz: LearningModule["quiz"];
  onAnswered?: (payload: { moduleId: LearningModule["id"]; correct: boolean }) => void;
  resetSignal?: number;
};

export function MiniQuiz({ moduleId, quiz, onAnswered, resetSignal = 0 }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [notified, setNotified] = useState(false);

  const isCorrect = useMemo(
    () => submitted && selectedIndex !== null && selectedIndex === quiz.correctIndex,
    [quiz.correctIndex, selectedIndex, submitted],
  );

  const submit = () => {
    if (selectedIndex === null) return;
    setSubmitted(true);
    const correct = selectedIndex === quiz.correctIndex;
    if (correct && !notified) {
      onAnswered?.({ moduleId, correct: true });
      setNotified(true);
    }
  };

  useEffect(() => {
    setSelectedIndex(null);
    setSubmitted(false);
    setNotified(false);
  }, [moduleId, resetSignal]);

  return (
    <section className="glass-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ds-muted">Mini check</p>
      <p className="mt-2 text-sm font-semibold text-ds-primary">{quiz.question}</p>

      <div className="mt-4 flex flex-col gap-2">
        {quiz.options.map((option, index) => {
          const picked = selectedIndex === index;
          const showCorrect = submitted && index === quiz.correctIndex;
          const showWrong = submitted && picked && index !== quiz.correctIndex;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={[
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-200",
                picked ? "border-ds-accent bg-ds-surface text-ds-primary" : "border-ds-line text-ds-secondary",
                showCorrect ? "border-ds-accent text-ds-primary" : "",
                showWrong ? "border-ds-danger-border text-ds-danger" : "",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={submit} disabled={selectedIndex === null} className="btn-accent px-4 py-2 text-sm">
          Check answer
        </button>
        {submitted ? (
          <span className={isCorrect ? "text-xs text-ds-accent" : "text-xs text-ds-danger"}>
            {isCorrect ? "Correct!" : "Not quite. Try reviewing the hint above."}
          </span>
        ) : null}
      </div>

      {submitted ? <p className="mt-3 text-xs leading-relaxed text-ds-secondary">{quiz.explanation}</p> : null}
    </section>
  );
}

