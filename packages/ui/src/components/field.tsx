import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface FieldProps {
  htmlFor: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

export function Field({ htmlFor, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint !== undefined && error === undefined ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
      {error !== undefined ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
