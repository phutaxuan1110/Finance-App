import React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // min-w-0 overrides the browser default of `min-width: auto` on
        // form controls. appearance-none is the actual fix for the
        // longstanding iOS/WebKit bug where `<input type="date">` and
        // `type="datetime-local">` ignore `width: 100%` and instead render
        // at their own native intrinsic width (based on the OS's date/time
        // chrome, not the CSS box) — without it, those two field types can
        // visibly stretch past every other field's right edge, all the way
        // to the container boundary, regardless of width/min-width. This
        // does not disable the native date/time picker itself on iOS —
        // tapping the field still opens it — it only removes the OS's
        // default control chrome so our own width/border/background apply.
        // (The accompanying vertical-centering fix for the WebKit
        // date/time internals lives in app/globals.css, next to the rest
        // of the ::-webkit-datetime-edit-* rules it has to coordinate with.)
        "block h-12 w-full min-w-0 appearance-none rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-soft",
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
