import type { ComponentPropsWithRef } from "react";

import { cn } from "../lib/cn";
import { controlClassName } from "./control";

export type InputProps = ComponentPropsWithRef<"input">;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn(controlClassName, className)} {...props} />;
}
