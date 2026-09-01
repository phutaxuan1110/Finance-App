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
        //
        // flex + items-center (replacing a plain `block` display) is what
        // actually re-centers the value vertically after appearance-none:
        // WebKit lays out a date/datetime-local input's internal
        // "date-and-time-value" content according to the HOST element's
        // own `display`/`align-items`, not the other way around — trying
        // to reach in and restyle the individual internal
        // `::-webkit-datetime-edit-*-field` pseudo-elements directly (the
        // previous approach here) is unreliable across iOS Safari
        // versions, since support for styling those specific
        // pseudo-elements is inconsistent; setting flex/align-items on the
        // input itself is the well-established, broadly-supported fix.
        // This has no visible effect on plain text/number inputs — an
        // <input> has no DOM children for `display: flex` to lay out, so
        // its own text rendering (drawn internally by the UA, not as flex
        // children) is unaffected.
        "flex h-12 w-full min-w-0 items-center appearance-none rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-soft",
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
