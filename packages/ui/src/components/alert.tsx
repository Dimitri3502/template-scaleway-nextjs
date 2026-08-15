import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

const alertVariants = cva("rounded-card border px-4 py-3 text-sm", {
  variants: {
    tone: {
      neutral: "border-border bg-surface-sunken text-ink",
      info: "border-brand-200 bg-brand-50 text-brand-800",
      success: "border-success/30 bg-success-soft text-success",
      warning: "border-warning/30 bg-warning-soft text-warning",
      danger: "border-danger/30 bg-danger-soft text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface AlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function Alert({ tone, title, className, children }: AlertProps) {
  return (
    <div role="status" className={cn(alertVariants({ tone }), className)}>
      {title !== undefined ? <p className="font-medium">{title}</p> : null}
      {children !== undefined ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
    </div>
  );
}
