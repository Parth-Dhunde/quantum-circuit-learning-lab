import { LEARNING_MODULES, type LearningModule } from "../data/learningModules";

export type QuizMode = "practice" | "test";

export type Question = {
  id: string;
  moduleId: LearningModule["id"];
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

type ModuleQuestionBank = Record<LearningModule["id"], Question[]>;

function buildModuleQuestions(module: LearningModule): Question[] {
  const generated: Question[] = [
    {
      id: `${module.id}-base`,
      moduleId: module.id,
      question: module.quiz.question,
      options: module.quiz.options,
      correctIndex: module.quiz.correctIndex,
      explanation: module.quiz.explanation,
    },
  ];

  for (let i = 1; i < 20; i += 1) {
    const insight = module.keyInsight;
    const practice = module.practice[i % module.practice.length] ?? module.practice[0] ?? "Review the demo circuit.";
    generated.push({
      id: `${module.id}-generated-${i}`,
      moduleId: module.id,
      question: `${module.title}: concept check #${i + 1}`,
      options: [
        `Best aligned with module insight: ${insight}`,
        "Ignore amplitudes and rely only on one shot",
        "Skip demo playback and infer results without simulation",
      ],
      correctIndex: 0,
      explanation: `Key idea: ${insight} Practice prompt: ${practice}`,
    });
  }

  return generated;
}

const QUESTION_BANK_BY_MODULE: ModuleQuestionBank = LEARNING_MODULES.reduce((acc, module) => {
  acc[module.id] = buildModuleQuestions(module);
  return acc;
}, {} as ModuleQuestionBank);

export function buildQuizSessionQuestions(moduleIds: LearningModule["id"][], size = 20): Question[] {
  const targets = moduleIds.length === 0 ? LEARNING_MODULES.map((module) => module.id) : moduleIds;
  const pooled = targets.flatMap((moduleId) => QUESTION_BANK_BY_MODULE[moduleId] ?? []);
  return [...pooled].sort(() => Math.random() - 0.5).slice(0, Math.min(size, pooled.length));
}

export function resultMessage(percent: number): string {
  if (percent >= 80) return "Strong understanding";
  if (percent >= 50) return "Good, but revise a bit";
  return "Needs revision";
}
