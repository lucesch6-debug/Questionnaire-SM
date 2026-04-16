import { BadgeCheck, CheckCircle2, XCircle } from "lucide-react";
import type { AnswerState, OptionKey } from "../lib/quizProgress";

type ChoiceButtonProps = {
  optionKey: OptionKey;
  text: string;
  answer?: AnswerState;
  correctOption: OptionKey;
  onSelect: () => void;
};

export function ChoiceButton({
  optionKey,
  text,
  answer,
  correctOption,
  onSelect,
}: ChoiceButtonProps) {
  const isAnswered = Boolean(answer);
  const isSelected = answer?.selectedOption === optionKey;
  const isCorrect = correctOption === optionKey;

  const classes = ["choice-button"];

  if (isAnswered) {
    if (isCorrect) {
      classes.push("choice-button--correct");
    } else if (isSelected) {
      classes.push("choice-button--selected-wrong");
    } else {
      classes.push("choice-button--dimmed");
    }
  }

  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={onSelect}
      className={classes.join(" ")}
    >
      <span className="choice-button__key">{optionKey}</span>

      <span className="choice-button__content">
        <span className="choice-button__text">{text}</span>
        {isAnswered && isSelected && (
          <span className="choice-button__meta">Your answer</span>
        )}
        {isAnswered && !isSelected && isCorrect && (
          <span className="choice-button__meta">Correct answer</span>
        )}
      </span>

      <span className="choice-button__icon" aria-hidden="true">
        {isAnswered && isSelected ? (
          answer?.isCorrect ? (
            <CheckCircle2 className="icon-sm" />
          ) : (
            <XCircle className="icon-sm" />
          )
        ) : isAnswered && isCorrect ? (
          <BadgeCheck className="icon-sm" />
        ) : null}
      </span>
    </button>
  );
}
