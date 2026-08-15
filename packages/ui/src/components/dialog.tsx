"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Libellé accessible du dialogue : les textes arrivent en props, jamais du design system. */
  title: string;
  closeLabel: string;
  className?: string;
  children: ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  closeLabel,
  className,
  children,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-sand-900/80 backdrop-blur-sm" />
        <BaseDialog.Popup
          className={cn(
            "fixed inset-0 z-50 flex flex-col pt-safe-top pb-safe-bottom outline-none",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <BaseDialog.Title className="truncate text-sm font-medium text-ink-inverted">
              {title}
            </BaseDialog.Title>
            <BaseDialog.Close
              aria-label={closeLabel}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-inverted hover:bg-sand-0/10"
            >
              <X className="size-5" aria-hidden />
            </BaseDialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
