import { startTransition, useEffect, useState } from "react";
import { quizSessions } from "../data/quizData";
import {
  createInitialProgress,
  getOverallStats,
  getSessionStats,
  readStoredProgress,
  writeStoredProgress,
  type OptionKey,
  type ProgressBySession,
  type SessionId,
  type SessionProgress,
} from "../lib/quizProgress";

const DEFAULT_SESSION_ID = quizSessions[0]!.id;

export function useQuizProgress() {
  const [selectedSessionId, setSelectedSessionId] =
    useState<SessionId>(DEFAULT_SESSION_ID);
  const [progressBySession, setProgressBySession] = useState<ProgressBySession>(
    () => readStoredProgress(),
  );

  useEffect(() => {
    writeStoredProgress(progressBySession);
  }, [progressBySession]);

  const currentSession =
    quizSessions.find((session) => session.id === selectedSessionId) ??
    quizSessions[0]!;
  const currentProgress = progressBySession[currentSession.id];
  const currentQuestion = currentSession.items[currentProgress.currentIndex]!;
  const currentAnswer = currentProgress.answers[currentQuestion.id];
  const currentSessionStats = getSessionStats(currentSession, currentProgress);
  const overallStats = getOverallStats(progressBySession);
  const hasPreviousQuestion = currentProgress.currentIndex > 0;
  const hasNextQuestion =
    currentProgress.currentIndex < currentSession.items.length - 1;

  function updateSessionProgress(
    sessionId: SessionId,
    updater: (sessionProgress: SessionProgress) => SessionProgress,
  ) {
    setProgressBySession((previous) => ({
      ...previous,
      [sessionId]: updater(previous[sessionId]),
    }));
  }

  function selectSession(sessionId: SessionId) {
    startTransition(() => {
      setSelectedSessionId(sessionId);
    });
  }

  function jumpToQuestion(index: number) {
    updateSessionProgress(currentSession.id, (sessionProgress) => ({
      ...sessionProgress,
      currentIndex: Math.max(
        0,
        Math.min(index, Math.max(currentSession.items.length - 1, 0)),
      ),
    }));
  }

  function answerCurrentQuestion(optionKey: OptionKey) {
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

  function navigateQuestions(step: number) {
    jumpToQuestion(currentProgress.currentIndex + step);
  }

  function resetSession(sessionId: SessionId) {
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

  function resetAll() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Reset all ${quizSessions.length} sessions and clear all saved progress?`,
      )
    ) {
      return;
    }

    setProgressBySession(createInitialProgress());

    startTransition(() => {
      setSelectedSessionId(DEFAULT_SESSION_ID);
    });
  }

  return {
    progressBySession,
    overallStats,
    currentSession,
    currentProgress,
    currentQuestion,
    currentAnswer,
    currentSessionStats,
    hasPreviousQuestion,
    hasNextQuestion,
    selectSession,
    jumpToQuestion,
    answerCurrentQuestion,
    navigateQuestions,
    resetSession,
    resetAll,
  };
}
