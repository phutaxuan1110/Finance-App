import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // min-w-0 overrides the browser default of `min-width: auto` on
        // form controls, which for native pickers (date, datetime-local)
        // is based on their own rendered content — e.g. a long localized
        // "01:05 ngày 2 thg 9, 2026" string can otherwise force the input
        // (and the flex column item wrapping it) wider than `width: 100%`
        // would suggest, making that one field visibly wider than its
        // siblings and, in a flex layout, overflow past the container.
        "h-12 w-full min-w-0 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-soft",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full min-w-0 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-soft resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-xs font-medium text-text-muted mb-1.5 block", className)} {...props} />
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-text-primary outline-none transition-colors focus:border-accent-soft appearance-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
