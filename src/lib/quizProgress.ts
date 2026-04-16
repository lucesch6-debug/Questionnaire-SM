import { quizSessions, totalQuestionCount } from "../data/quizData";

export type Session = (typeof quizSessions)[number];
export type Question = Session["items"][number];
export type SessionId = Session["id"];
export type OptionKey = Question["options"][number]["key"];

export type AnswerState = {
  selectedOption: OptionKey;
  isCorrect: boolean;
};

export type SessionProgress = {
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

export type ProgressBySession = Record<SessionId, SessionProgress>;

export type SessionStats = {
  answeredCount: number;
  correctCount: number;
  remainingCount: number;
  accuracy: number;
  completionPercent: number;
  isComplete: boolean;
};

export type OverallStats = {
  answeredCount: number;
  correctCount: number;
  accuracy: number;
  completionPercent: number;
  sessionCount: number;
  totalQuestionCount: number;
};

const STORAGE_KEY = "strategic-quiz-progress-v1";

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(value, Math.max(length - 1, 0)));
}

export function createInitialProgress(): ProgressBySession {
  return Object.fromEntries(
    quizSessions.map((session) => [
      session.id,
      {
        currentIndex: 0,
        answers: {},
      },
    ]),
  ) as ProgressBySession;
}

export function readStoredProgress(): ProgressBySession {
  if (typeof window === "undefined") {
    return createInitialProgress();
  }

  const fallback = createInitialProgress();
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ProgressBySession>;

    for (const session of quizSessions) {
      const storedSession = parsed?.[session.id];

      if (!storedSession || typeof storedSession !== "object") {
        continue;
      }

      const sanitizedAnswers: Record<string, AnswerState> = {};

      for (const question of session.items) {
        const storedAnswer = storedSession.answers?.[question.id];

        if (
          storedAnswer &&
          typeof storedAnswer === "object" &&
          ["A", "B", "C", "D"].includes(storedAnswer.selectedOption) &&
          typeof storedAnswer.isCorrect === "boolean"
        ) {
          sanitizedAnswers[question.id] = {
            selectedOption: storedAnswer.selectedOption as OptionKey,
            isCorrect: storedAnswer.isCorrect,
          };
        }
      }

      fallback[session.id] = {
        currentIndex: clampIndex(
          typeof storedSession.currentIndex === "number"
            ? storedSession.currentIndex
            : 0,
          session.items.length,
        ),
        answers: sanitizedAnswers,
      };
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredProgress(progressBySession: ProgressBySession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressBySession));
  }
}

export function getSessionStats(
  session: Session,
  progress: SessionProgress,
): SessionStats {
  const answeredCount = Object.keys(progress.answers).length;
  const correctCount = Object.values(progress.answers).filter(
    (answer) => answer.isCorrect,
  ).length;

  return {
    answeredCount,
    correctCount,
    remainingCount: session.questionCount - answeredCount,
    accuracy:
      answeredCount === 0
        ? 0
        : Math.round((correctCount / answeredCount) * 100),
    completionPercent: Math.round(
      (answeredCount / session.questionCount) * 100,
    ),
    isComplete: answeredCount === session.questionCount,
  };
}

export function getOverallStats(
  progressBySession: ProgressBySession,
): OverallStats {
  const answeredCount = quizSessions.reduce(
    (total, session) =>
      total +
      getSessionStats(session, progressBySession[session.id]).answeredCount,
    0,
  );
  const correctCount = quizSessions.reduce(
    (total, session) =>
      total +
      getSessionStats(session, progressBySession[session.id]).correctCount,
    0,
  );

  return {
    answeredCount,
    correctCount,
    accuracy:
      answeredCount === 0
        ? 0
        : Math.round((correctCount / answeredCount) * 100),
    completionPercent: Math.round((answeredCount / totalQuestionCount) * 100),
    sessionCount: quizSessions.length,
    totalQuestionCount,
  };
}
