import { startTransition, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  CheckCircle2,
  CircleHelp,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import "./quiz.css";
import { quizSessions, totalQuestionCount } from "./data/quizData";

type Session = (typeof quizSessions)[number];
type Question = Session["items"][number];
type SessionId = Session["id"];
type OptionKey = Question["options"][number]["key"];

type AnswerState = {
  selectedOption: OptionKey;
  isCorrect: boolean;
};

type SessionProgress = {
  currentIndex: number;
  answers: Record<string, AnswerState>;
};

type ProgressBySession = Record<SessionId, SessionProgress>;

const STORAGE_KEY = "strategic-quiz-progress-v1";

function createInitialProgress(): ProgressBySession {
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

function clampIndex(value: number, length: number) {
  return Math.max(0, Math.min(value, Math.max(length - 1, 0)));
}

function readStoredProgress(): ProgressBySession {
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

function getSessionStats(session: Session, progress: SessionProgress) {
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

function SessionCard({
  isActive,
  session,
  progress,
  onSelect,
}: {
  isActive: boolean;
  session: Session;
  progress: SessionProgress;
  onSelect: () => void;
}) {
  const stats = getSessionStats(session, progress);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`quiz-card w-full rounded-[26px] p-4 text-left transition-all ${
        isActive
          ? "border-[rgba(217,119,6,0.45)] shadow-[0_18px_45px_rgba(132,84,13,0.12)]"
          : "hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--quiz-muted)]">
            {session.label}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--quiz-ink)]">
            {session.chapter}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            stats.isComplete
              ? "bg-[var(--quiz-success-soft)] text-[var(--quiz-success-ink)]"
              : "bg-[var(--quiz-accent-soft)] text-[var(--quiz-accent-ink)]"
          }`}
        >
          {stats.correctCount}/{session.questionCount} pts
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-[var(--quiz-muted)]">Answered</p>
          <p className="font-semibold text-[var(--quiz-ink)]">
            {stats.answeredCount}
          </p>
        </div>
        <div>
          <p className="text-[var(--quiz-muted)]">Remaining</p>
          <p className="font-semibold text-[var(--quiz-ink)]">
            {stats.remainingCount}
          </p>
        </div>
        <div>
          <p className="text-[var(--quiz-muted)]">Accuracy</p>
          <p className="font-semibold text-[var(--quiz-ink)]">
            {stats.accuracy}%
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-[var(--quiz-accent)] transition-all"
          style={{ width: `${stats.completionPercent}%` }}
        />
      </div>
    </button>
  );
}

function QuestionChip({
  isActive,
  number,
  answer,
  onClick,
}: {
  isActive: boolean;
  number: number;
  answer?: AnswerState;
  onClick: () => void;
}) {
  const toneClass = answer
    ? answer.isCorrect
      ? "bg-[var(--quiz-success-soft)] text-[var(--quiz-success-ink)] border-[rgba(31,118,100,0.25)]"
      : "bg-[var(--quiz-danger-soft)] text-[var(--quiz-danger-ink)] border-[rgba(171,55,55,0.22)]"
    : "bg-white/70 text-[var(--quiz-ink)] border-white/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-all ${toneClass} ${
        isActive
          ? "ring-2 ring-[rgba(217,119,6,0.3)] ring-offset-2 ring-offset-transparent"
          : "hover:-translate-y-0.5"
      }`}
    >
      {number}
    </button>
  );
}

function ChoiceButton({
  optionKey,
  text,
  answer,
  correctOption,
  onSelect,
}: {
  optionKey: OptionKey;
  text: string;
  answer?: AnswerState;
  correctOption: OptionKey;
  onSelect: () => void;
}) {
  const isAnswered = Boolean(answer);
  const isSelected = answer?.selectedOption === optionKey;
  const isCorrect = correctOption === optionKey;

  let stateClass =
    "border-white/70 bg-white/80 text-[var(--quiz-ink)] hover:border-[rgba(217,119,6,0.35)] hover:bg-white";

  if (isAnswered) {
    if (isCorrect) {
      stateClass =
        "border-[rgba(31,118,100,0.26)] bg-[var(--quiz-success-soft)] text-[var(--quiz-success-ink)]";
    } else if (isSelected) {
      stateClass =
        "border-[rgba(171,55,55,0.22)] bg-[var(--quiz-danger-soft)] text-[var(--quiz-danger-ink)]";
    } else {
      stateClass =
        "border-white/50 bg-white/55 text-[var(--quiz-muted)]";
    }
  }

  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={onSelect}
      className={`quiz-choice flex w-full items-start gap-4 rounded-[24px] border p-4 text-left ${stateClass}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(20,35,38,0.06)] text-sm font-bold">
        {optionKey}
      </span>
      <div className="flex-1">
        <p className="text-sm leading-7 md:text-[15px]">{text}</p>
        {isAnswered && isSelected && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">
            Your answer
          </p>
        )}
        {isAnswered && !isSelected && isCorrect && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]">
            Correct answer
          </p>
        )}
      </div>
      {isAnswered && isSelected ? (
        answer?.isCorrect ? (
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" />
        ) : (
          <XCircle className="mt-1 h-5 w-5 shrink-0" />
        )
      ) : isAnswered && isCorrect ? (
        <BadgeCheck className="mt-1 h-5 w-5 shrink-0" />
      ) : null}
    </button>
  );
}

export default function App() {
  const [selectedSessionId, setSelectedSessionId] = useState<SessionId>(
    quizSessions[0].id,
  );
  const [progressBySession, setProgressBySession] = useState<ProgressBySession>(
    () => readStoredProgress(),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(progressBySession),
      );
    }
  }, [progressBySession]);

  const currentSession =
    quizSessions.find((session) => session.id === selectedSessionId) ??
    quizSessions[0];
  const currentProgress = progressBySession[currentSession.id];
  const currentQuestion = currentSession.items[currentProgress.currentIndex];
  const currentAnswer = currentProgress.answers[currentQuestion.id];

  const sessionStatsEntries = quizSessions.map((session) => ({
    session,
    stats: getSessionStats(session, progressBySession[session.id]),
  }));

  const overallAnswered = sessionStatsEntries.reduce(
    (total, entry) => total + entry.stats.answeredCount,
    0,
  );
  const overallCorrect = sessionStatsEntries.reduce(
    (total, entry) => total + entry.stats.correctCount,
    0,
  );
  const overallAccuracy =
    overallAnswered === 0
      ? 0
      : Math.round((overallCorrect / overallAnswered) * 100);
  const overallCompletion = Math.round(
    (overallAnswered / totalQuestionCount) * 100,
  );
  const sessionCount = quizSessions.length;

  function updateSessionProgress(
    sessionId: SessionId,
    updater: (sessionProgress: SessionProgress) => SessionProgress,
  ) {
    setProgressBySession((previous) => ({
      ...previous,
      [sessionId]: updater(previous[sessionId]),
    }));
  }

  function handleSelectSession(sessionId: SessionId) {
    startTransition(() => {
      setSelectedSessionId(sessionId);
    });
  }

  function handleJumpToQuestion(index: number) {
    updateSessionProgress(currentSession.id, (sessionProgress) => ({
      ...sessionProgress,
      currentIndex: clampIndex(index, currentSession.items.length),
    }));
  }

  function handleAnswer(optionKey: OptionKey) {
    if (currentAnswer) {
      return;
    }

    updateSessionProgress(currentSession.id, (sessionProgress) => ({
      ...sessionProgress,
      answers: {
        ...sessionProgress.answers,
        [currentQuestion.id]: {
          selectedOption: optionKey,
          isCorrect: optionKey === currentQuestion.correctOption,
        },
      },
    }));
  }

  function handleNavigate(step: number) {
    handleJumpToQuestion(currentProgress.currentIndex + step);
  }

  function handleResetSession(sessionId: SessionId) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Reset this session and clear its score?")
    ) {
      return;
    }

    updateSessionProgress(sessionId, () => ({
      currentIndex: 0,
      answers: {},
    }));
  }

  function handleResetAll() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Reset all ${sessionCount} sessions and clear all saved progress?`,
      )
    ) {
      return;
    }

    const nextProgress = createInitialProgress();
    setProgressBySession(nextProgress);
    startTransition(() => {
      setSelectedSessionId(quizSessions[0].id);
    });
  }

  const currentSessionStats = getSessionStats(
    currentSession,
    currentProgress,
  );
  const hasPreviousQuestion = currentProgress.currentIndex > 0;
  const hasNextQuestion =
    currentProgress.currentIndex < currentSession.items.length - 1;

  return (
    <div className="quiz-shell">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="quiz-card rounded-[34px] px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--quiz-muted)]">
                Strategic Management Drillbook
              </p>
              <h1 className="quiz-title mt-3 text-4xl leading-none md:text-6xl">
                Verified Quiz Trainer
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--quiz-muted)] md:text-base">
                {sessionCount} verified questionnaires, {totalQuestionCount}{" "}
                multiple-choice questions, instant scoring, immediate
                right-or-wrong feedback, and the original justification from
                the answer key after every answer.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="quiz-metric rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                  Points
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--quiz-ink)]">
                  {overallCorrect}/{totalQuestionCount}
                </p>
              </div>
              <div className="quiz-metric rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                  Answered
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--quiz-ink)]">
                  {overallAnswered}
                </p>
              </div>
              <div className="quiz-metric rounded-[24px] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                  Accuracy
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--quiz-ink)]">
                  {overallAccuracy}%
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-[var(--quiz-muted)]">
              <BadgeCheck className="h-4 w-4 text-[var(--quiz-success-ink)]" />
              Answer mappings checked against the paired answer PDFs.
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleResetSession(currentSession.id)}
                className="rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm font-semibold text-[var(--quiz-ink)] transition hover:bg-white"
              >
                Reset current session
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="rounded-full border border-[rgba(171,55,55,0.16)] bg-[var(--quiz-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--quiz-danger-ink)] transition hover:brightness-105"
              >
                Reset all progress
              </button>
            </div>
          </div>

          <div className="mt-5 h-2 rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[var(--quiz-accent)] transition-all"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="quiz-card rounded-[30px] p-4">
              <div className="flex items-center gap-3">
                <BookOpenText className="h-5 w-5 text-[var(--quiz-accent-ink)]" />
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                    Sessions
                  </p>
                  <p className="text-sm text-[var(--quiz-muted)]">
                    Switch between the {sessionCount} questionnaires at any
                    time.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {quizSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    isActive={session.id === currentSession.id}
                    session={session}
                    progress={progressBySession[session.id]}
                    onSelect={() => handleSelectSession(session.id)}
                  />
                ))}
              </div>
            </div>

            <div className="quiz-card rounded-[30px] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                    Navigator
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--quiz-ink)]">
                    {currentSession.label}
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--quiz-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--quiz-accent-ink)]">
                  {currentSessionStats.answeredCount}/
                  {currentSession.questionCount}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {currentSession.items.map((question, index) => (
                  <QuestionChip
                    key={question.id}
                    isActive={index === currentProgress.currentIndex}
                    number={question.number}
                    answer={currentProgress.answers[question.id]}
                    onClick={() => handleJumpToQuestion(index)}
                  />
                ))}
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            <section className="quiz-card rounded-[30px] p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                    Active questionnaire
                  </p>
                  <h2 className="quiz-title mt-2 text-3xl md:text-4xl">
                    {currentSession.label}: {currentSession.chapter}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--quiz-muted)]">
                    Question {currentQuestion.number} of{" "}
                    {currentSession.questionCount}. Score updates immediately
                    after each answer.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[22px] bg-white/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--quiz-muted)]">
                      Points
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--quiz-ink)]">
                      {currentSessionStats.correctCount}/
                      {currentSession.questionCount}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--quiz-muted)]">
                      Accuracy
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--quiz-ink)]">
                      {currentSessionStats.accuracy}%
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-white/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--quiz-muted)]">
                      Remaining
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--quiz-ink)]">
                      {currentSessionStats.remainingCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 h-2 rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-[var(--quiz-sage)] transition-all"
                  style={{
                    width: `${currentSessionStats.completionPercent}%`,
                  }}
                />
              </div>
            </section>

            {currentSessionStats.isComplete && (
              <section className="quiz-card rounded-[30px] border-[rgba(31,118,100,0.22)] bg-[var(--quiz-success-soft)] p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <Trophy className="mt-1 h-6 w-6 text-[var(--quiz-success-ink)]" />
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--quiz-success-ink)]">
                      Session complete
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--quiz-success-ink)]">
                      You finished {currentSession.label} with{" "}
                      {currentSessionStats.correctCount} correct answers out of{" "}
                      {currentSession.questionCount}. You can review any question
                      below or reset the session to practice again.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="quiz-card rounded-[30px] p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[var(--quiz-accent-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--quiz-accent-ink)]">
                  Question {currentQuestion.number}
                </span>
                <span
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
                    currentAnswer
                      ? currentAnswer.isCorrect
                        ? "bg-[var(--quiz-success-soft)] text-[var(--quiz-success-ink)]"
                        : "bg-[var(--quiz-danger-soft)] text-[var(--quiz-danger-ink)]"
                      : "bg-white/70 text-[var(--quiz-muted)]"
                  }`}
                >
                  {currentAnswer
                    ? currentAnswer.isCorrect
                      ? "Correct"
                      : "Incorrect"
                    : "Awaiting answer"}
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-semibold leading-tight text-[var(--quiz-ink)] md:text-[2rem]">
                {currentQuestion.prompt}
              </h2>

              <div className="mt-6 space-y-3">
                {currentQuestion.options.map((option) => (
                  <ChoiceButton
                    key={option.key}
                    optionKey={option.key}
                    text={option.text}
                    answer={currentAnswer}
                    correctOption={currentQuestion.correctOption}
                    onSelect={() => handleAnswer(option.key)}
                  />
                ))}
              </div>
            </section>

            {currentAnswer && (
              <section
                className={`quiz-card rounded-[30px] p-5 md:p-6 ${
                  currentAnswer.isCorrect
                    ? "border-[rgba(31,118,100,0.22)] bg-[var(--quiz-success-soft)]"
                    : "border-[rgba(171,55,55,0.18)] bg-[var(--quiz-danger-soft)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {currentAnswer.isCorrect ? (
                    <CheckCircle2 className="mt-1 h-6 w-6 text-[var(--quiz-success-ink)]" />
                  ) : (
                    <XCircle className="mt-1 h-6 w-6 text-[var(--quiz-danger-ink)]" />
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                        Result
                      </p>
                      <h2
                        className={`mt-2 text-xl font-semibold ${
                          currentAnswer.isCorrect
                            ? "text-[var(--quiz-success-ink)]"
                            : "text-[var(--quiz-danger-ink)]"
                        }`}
                      >
                        {currentAnswer.isCorrect
                          ? "Correct. Your point is counted."
                          : "Incorrect. The correct answer is shown below."}
                      </h2>
                    </div>

                    <div className="rounded-[22px] bg-white/65 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                        Official answer
                      </p>
                      <p className="mt-2 text-base font-semibold text-[var(--quiz-ink)]">
                        {currentQuestion.correctOption}){" "}
                        {currentQuestion.correctAnswerText}
                      </p>
                    </div>

                    <div>
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--quiz-muted)]">
                        <CircleHelp className="h-4 w-4" />
                        Justification
                      </p>
                      <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--quiz-ink)] md:text-[15px]">
                        {currentQuestion.justification}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="quiz-card rounded-[30px] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--quiz-muted)]">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[var(--quiz-accent-ink)]" />
                    Live points: {currentSessionStats.correctCount}
                  </span>
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-[var(--quiz-success-ink)]" />
                    Verified answer key
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleNavigate(-1)}
                    disabled={!hasPreviousQuestion}
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--quiz-ink)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate(1)}
                    disabled={!hasNextQuestion}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--quiz-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetSession(currentSession.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--quiz-ink)] transition hover:bg-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restart session
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
