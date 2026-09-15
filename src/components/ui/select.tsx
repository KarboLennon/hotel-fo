import * as React from "react";
import { cn } from "@/lib/cn";
import { inputClass } from "./input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputClass, "appearance-none bg-no-repeat pr-7", className)}
      style={{ backgroundImage: "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)", backgroundPosition: "calc(100% - 14px) 55%, calc(100% - 9px) 55%", backgroundSize: "5px 5px, 5px 5px" }}
      {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";
