import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "../auth/AuthProvider";
import type { LearningModule } from "../data/learningModules";
import { readUserProgress, writeUserProgress } from "../utils/userProgress";
import { buildQuizSessionQuestions, type Question, type QuizMode } from "./questionBank";

type QuizSessionState = {
  started: boolean;
  mode: QuizMode;
  selectedTopics: LearningModule["id"][];
  questions: Question[];
  answers: Record<string, number>;
  score: number;
};

type QuizSessionContextValue = QuizSessionState & {
  startSession: (config: { mode: QuizMode; selectedTopics: LearningModule["id"][] }) => boolean;
  answerQuestion: (questionId: string, answer: number) => void;
  finishSession: () => void;
  resetSession: () => void;
};

const defaultState: QuizSessionState = {
  started: false,
  mode: "practice",
  selectedTopics: [],
  questions: [],
  answers: {},
  score: 0,
};

const QuizSessionContext = createContext<QuizSessionContextValue | undefined>(undefined);

function isValidQuizState(input: unknown): input is QuizSessionState {
  if (!input || typeof input !== "object") return false;
  const x = input as Record<string, unknown>;
  return (
    typeof x.started === "boolean" &&
    (x.mode === "practice" || x.mode === "test") &&
    Array.isArray(x.selectedTopics) &&
    Array.isArray(x.questions) &&
    typeof x.answers === "object" &&
    x.answers !== null &&
    typeof x.score === "number" &&
    Number.isFinite(x.score)
  );
}

export function QuizSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<QuizSessionState>(defaultState);

  useEffect(() => {
    if (!user?.uid) {
      setState(defaultState);
      return;
    }
    const persisted = readUserProgress(user.uid).quizProgress;
    if (!persisted) {
      setState(defaultState);
      return;
    }
    if (!isValidQuizState(persisted)) {
      setState(defaultState);
      return;
    }
    setState({
      started: persisted.started,
      mode: persisted.mode,
      selectedTopics: persisted.selectedTopics as LearningModule["id"][],
      questions: persisted.questions as Question[],
      answers: persisted.answers as Record<string, number>,
      score: persisted.score,
    });
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    writeUserProgress(user.uid, {
      quizProgress: {
        started: state.started,
        mode: state.mode,
        selectedTopics: state.selectedTopics,
        questions: state.questions,
        answers: state.answers,
        score: state.score,
        totalQuestions: state.questions.length,
      },
    });
  }, [state, user?.uid]);

  const value = useMemo<QuizSessionContextValue>(
    () => ({
      ...state,
      startSession({ mode, selectedTopics }) {
        const questions = buildQuizSessionQuestions(selectedTopics, 20);
        if (questions.length === 0) {
          setState(defaultState);
          return false;
        }
        setState({
          started: true,
          mode,
          selectedTopics,
          questions,
          answers: {},
          score: 0,
        });
        return true;
      },
      answerQuestion(questionId, answer) {
        setState((prev) => {
          if (!prev.started) return prev;
          const nextAnswers = { ...prev.answers, [questionId]: answer };
          const nextScore = prev.questions.reduce(
            (acc, q) => (nextAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
            0,
          );
          return { ...prev, answers: nextAnswers, score: nextScore };
        });
      },
      finishSession() {
        setState((prev) => ({ ...prev, started: false }));
      },
      resetSession() {
        setState(defaultState);
      },
    }),
    [state],
  );

  return <QuizSessionContext.Provider value={value}>{children}</QuizSessionContext.Provider>;
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error("useQuizSession must be used within QuizSessionProvider");
  }
  return context;
}
