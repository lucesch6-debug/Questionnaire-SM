import {
  getSessionStats,
  type Session,
  type SessionProgress,
} from "../lib/quizProgress";

type SessionCardProps = {
  isActive: boolean;
  session: Session;
  progress: SessionProgress;
  onSelect: () => void;
};

export function SessionCard({
  isActive,
  session,
  progress,
  onSelect,
}: SessionCardProps) {
  const stats = getSessionStats(session, progress);

  return (
    <article className={`session-card${isActive ? " session-card--active" : ""}`}>
      <button
        type="button"
        onClick={onSelect}
        className="session-card__button"
        aria-pressed={isActive}
      >
        <div className="session-card__header">
          <div>
            <p className="eyebrow eyebrow--compact">{session.label}</p>
            <h3 className="session-card__title">{session.chapter}</h3>
          </div>

          <span
            className={`pill ${stats.isComplete ? "pill--success" : "pill--accent"}`}
          >
            {stats.correctCount}/{session.questionCount} pts
          </span>
        </div>

        <div className="session-card__stats">
          <div className="mini-stat">
            <span className="mini-stat__label">Answered</span>
            <span className="mini-stat__value">{stats.answeredCount}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat__label">Remaining</span>
            <span className="mini-stat__value">{stats.remainingCount}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat__label">Accuracy</span>
            <span className="mini-stat__value">{stats.accuracy}%</span>
          </div>
        </div>

        <div className="progress-track progress-track--thin">
          <div
            className="progress-fill progress-fill--accent"
            style={{ width: `${stats.completionPercent}%` }}
          />
        </div>
      </button>
    </article>
  );
}
