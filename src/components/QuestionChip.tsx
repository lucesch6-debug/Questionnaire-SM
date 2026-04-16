import type { AnswerState } from "../lib/quizProgress";

type QuestionChipProps = {
  isActive: boolean;
  number: number;
  answer?: AnswerState;
  onClick: () => void;
};

export function QuestionChip({
  isActive,
  number,
  answer,
  onClick,
}: QuestionChipProps) {
  const classes = ["question-chip"];

  if (isActive) {
    classes.push("question-chip--active");
  }

  if (answer?.isCorrect) {
    classes.push("question-chip--correct");
  } else if (answer) {
    classes.push("question-chip--incorrect");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes.join(" ")}
      aria-pressed={isActive}
      aria-label={`Go to question ${number}`}
    >
      {number}
    </button>
  );
}
