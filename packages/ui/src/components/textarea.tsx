import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";
import { controlClassName } from "./control";

export type TextareaProps = ComponentPropsWithRef<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(controlClassName, "resize-none", className)} {...props} />;
}
