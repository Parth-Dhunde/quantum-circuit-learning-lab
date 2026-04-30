export type UserProgressPayload = {
  completedModules?: Record<string, { status: boolean; method: "quiz" | null }>;
  quizProgress?: {
    started: boolean;
    mode: "practice" | "test";
    selectedTopics: string[];
    questions: Array<{
      id: string;
      moduleId: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
    answers: Record<string, number>;
    score: number;
    totalQuestions: number;
  };
  lastModule?: string | null;
};

function keyFor(uid: string) {
  return `qc-progress-${uid}`;
}

export function readUserProgress(uid: string): UserProgressPayload {
  try {
    const raw = localStorage.getItem(keyFor(uid));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as UserProgressPayload;
  } catch {
    return {};
  }
}

export function writeUserProgress(uid: string, patch: Partial<UserProgressPayload>) {
  try {
    const current = readUserProgress(uid);
    const next: UserProgressPayload = { ...current, ...patch };
    localStorage.setItem(keyFor(uid), JSON.stringify(next));
  } catch {
    // no-op
  }
}
