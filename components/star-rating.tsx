"use client";

type StarRatingProps = {
  score: number;
  max?: number;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl"
};

export function StarRating({
  score,
  max = 5,
  size = "md"
}: StarRatingProps) {
  return (
    <span
      className={`inline-flex gap-0.5 ${SIZE_CLASSES[size]}`}
      aria-label={`${score} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          className={index < score ? "text-amber-400" : "text-zinc-300"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </span>
  );
}

type StarPickerProps = {
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
};

export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {Array.from({ length: 5 }, (_, index) => {
        const score = index + 1;
        const selected = score <= value;

        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={`text-3xl transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${
              selected ? "text-amber-400" : "text-zinc-300 hover:text-amber-300"
            }`}
            aria-label={`${score} star${score === 1 ? "" : "s"}`}
            aria-checked={value === score}
            role="radio"
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
