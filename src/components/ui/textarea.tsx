import * as React from "react";
import { cn } from "@/lib/cn";
import { inputClass } from "./input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn(inputClass, "min-h-20", className)} {...props} />,
);
Textarea.displayName = "Textarea";
