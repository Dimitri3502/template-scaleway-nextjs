import { cn } from "../lib/cn";

export interface ProgressBarProps {
  /** Progression de 0 à 100. */
  value: number;
  label: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
