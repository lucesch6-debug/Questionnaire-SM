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
import { ChoiceButton } from "./components/ChoiceButton";
import { MetricCard } from "./components/MetricCard";
import { QuestionChip } from "./components/QuestionChip";
import { SessionCard } from "./components/SessionCard";
import { quizSessions } from "./data/quizData";
import { useQuizProgress } from "./hooks/useQuizProgress";
import "./quiz.css";

export default function App() {
  const {
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
  } = useQuizProgress();

  return (
    <div className="quiz-shell">
      <div className="quiz-page">
        <header className="panel hero">
          <div className="hero__content">
            <div className="hero__intro">
              <p className="eyebrow">Strategic Management Drillbook</p>
              <h1 className="quiz-title">Verified Quiz Trainer</h1>
              <p className="hero__description">
                {overallStats.sessionCount} verified questionnaires,{" "}
                {overallStats.totalQuestionCount} multiple-choice questions,
                instant scoring, immediate right-or-wrong feedback, and the
                original justification from the answer key after every answer.
              </p>
            </div>

            <div className="metric-grid">
              <MetricCard
                label="Points"
                value={`${overallStats.correctCount}/${overallStats.totalQuestionCount}`}
                tone="accent"
              />
              <MetricCard
                label="Answered"
                value={`${overallStats.answeredCount}`}
              />
              <MetricCard
                label="Accuracy"
                value={`${overallStats.accuracy}%`}
                tone="success"
              />
            </div>
          </div>

          <div className="hero__footer">
            <div className="inline-note">
              <BadgeCheck className="icon-sm text-success" />
              <span>Answer mappings checked against the paired answer PDFs.</span>
            </div>

            <div className="button-row">
              <button
                type="button"
                onClick={() => resetSession(currentSession.id)}
                className="button"
              >
                Reset current session
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="button button--danger"
              >
                Reset all progress
              </button>
            </div>
          </div>

          <div className="progress-track progress-track--large">
            <div
              className="progress-fill progress-fill--accent"
              style={{ width: `${overallStats.completionPercent}%` }}
            />
          </div>
        </header>

        <div className="app-grid">
          <aside className="sidebar">
            <section className="panel sidebar-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow eyebrow--compact">Sessions</p>
                  <h2 className="section-heading__title">
                    <BookOpenText className="icon-sm" />
                    <span>Pick a questionnaire</span>
                  </h2>
                  <p className="section-heading__text">
                    Switch between the {overallStats.sessionCount} questionnaires
                    at any time.
                  </p>
                </div>
              </div>

              <div className="session-list">
                {quizSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    isActive={session.id === currentSession.id}
                    session={session}
                    progress={progressBySession[session.id]}
                    onSelect={() => selectSession(session.id)}
                  />
                ))}
              </div>
            </section>

            <section className="panel sidebar-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow eyebrow--compact">Navigator</p>
                  <h2 className="section-title">{currentSession.label}</h2>
                  <p className="section-heading__text">
                    Jump directly to any question in the active questionnaire.
                  </p>
                </div>

                <span className="pill pill--accent">
                  {currentSessionStats.answeredCount}/{currentSession.questionCount}
                </span>
              </div>

              <div className="navigator-grid">
                {currentSession.items.map((question, index) => (
                  <QuestionChip
                    key={question.id}
                    isActive={index === currentProgress.currentIndex}
                    number={question.number}
                    answer={currentProgress.answers[question.id]}
                    onClick={() => jumpToQuestion(index)}
                  />
                ))}
              </div>
            </section>
          </aside>

          <main className="content-stack">
            <section className="panel session-summary">
              <div>
                <p className="eyebrow eyebrow--compact">Active questionnaire</p>
                <h2 className="section-title">
                  {currentSession.label}: {currentSession.chapter}
                </h2>
                <p className="section-copy">
                  Question {currentQuestion.number} of{" "}
                  {currentSession.questionCount}. Score updates immediately
                  after each answer.
                </p>
              </div>

              <div className="summary-grid">
                <MetricCard
                  label="Points"
                  value={`${currentSessionStats.correctCount}/${currentSession.questionCount}`}
                  tone="accent"
                />
                <MetricCard
                  label="Accuracy"
                  value={`${currentSessionStats.accuracy}%`}
                  tone="success"
                />
                <MetricCard
                  label="Remaining"
                  value={`${currentSessionStats.remainingCount}`}
                />
              </div>

              <div className="progress-track session-summary__progress">
                <div
                  className="progress-fill progress-fill--sage"
                  style={{
                    width: `${currentSessionStats.completionPercent}%`,
                  }}
                />
              </div>
            </section>

            {currentSessionStats.isComplete && (
              <section className="panel banner banner--success">
                <Trophy className="banner__icon banner__icon--success" />
                <div>
                  <h2 className="banner__title">Session complete</h2>
                  <p className="banner__text">
                    You finished {currentSession.label} with{" "}
                    {currentSessionStats.correctCount} correct answers out of{" "}
                    {currentSession.questionCount}. You can review any question
                    below or reset the session to practice again.
                  </p>
                </div>
              </section>
            )}

            <section className="panel question-panel">
              <div className="status-row">
                <span className="pill pill--accent">
                  Question {currentQuestion.number}
                </span>
                <span
                  className={`pill ${
                    currentAnswer
                      ? currentAnswer.isCorrect
                        ? "pill--success"
                        : "pill--danger"
                      : "pill--neutral"
                  }`}
                >
                  {currentAnswer
                    ? currentAnswer.isCorrect
                      ? "Correct"
                      : "Incorrect"
                    : "Awaiting answer"}
                </span>
              </div>

              <h2 className="question-title">{currentQuestion.prompt}</h2>

              <div className="choice-list">
                {currentQuestion.options.map((option) => (
                  <ChoiceButton
                    key={option.key}
                    optionKey={option.key}
                    text={option.text}
                    answer={currentAnswer}
                    correctOption={currentQuestion.correctOption}
                    onSelect={() => answerCurrentQuestion(option.key)}
                  />
                ))}
              </div>
            </section>

            {currentAnswer && (
              <section
                className={`panel feedback-panel ${
                  currentAnswer.isCorrect
                    ? "feedback-panel--success"
                    : "feedback-panel--danger"
                }`}
              >
                {currentAnswer.isCorrect ? (
                  <CheckCircle2 className="banner__icon banner__icon--success" />
                ) : (
                  <XCircle className="banner__icon banner__icon--danger" />
                )}

                <div className="feedback-panel__content">
                  <div>
                    <p className="eyebrow eyebrow--compact">Result</p>
                    <h2 className="feedback-panel__title">
                      {currentAnswer.isCorrect
                        ? "Correct. Your point is counted."
                        : "Incorrect. The correct answer is shown below."}
                    </h2>
                  </div>

                  <div className="feedback-card">
                    <p className="eyebrow eyebrow--compact">Official answer</p>
                    <p className="feedback-answer">
                      {currentQuestion.correctOption}){" "}
                      {currentQuestion.correctAnswerText}
                    </p>
                  </div>

                  <div>
                    <p className="feedback-meta">
                      <CircleHelp className="icon-sm" />
                      <span>Justification</span>
                    </p>
                    <p className="feedback-text">
                      {currentQuestion.justification}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="panel control-bar">
              <div className="control-bar__meta">
                <span className="control-bar__meta-item">
                  <Target className="icon-sm text-accent" />
                  <span>Live points: {currentSessionStats.correctCount}</span>
                </span>
                <span className="control-bar__meta-item">
                  <BadgeCheck className="icon-sm text-success" />
                  <span>Verified answer key</span>
                </span>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  onClick={() => navigateQuestions(-1)}
                  disabled={!hasPreviousQuestion}
                  className="button"
                >
                  <ArrowLeft className="icon-sm" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateQuestions(1)}
                  disabled={!hasNextQuestion}
                  className="button button--primary"
                >
                  <span>Next</span>
                  <ArrowRight className="icon-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => resetSession(currentSession.id)}
                  className="button"
                >
                  <RotateCcw className="icon-sm" />
                  <span>Restart session</span>
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
