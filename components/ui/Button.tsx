"use client";

import React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]",
  secondary: "bg-white/[0.08] text-text-primary hover:bg-white/[0.13] active:scale-[0.98]",
  ghost: "bg-transparent text-text-primary hover:bg-white/[0.06] active:scale-[0.98]",
  danger: "bg-danger/15 text-danger hover:bg-danger/25 active:scale-[0.98]",
  outline: "bg-transparent border border-white/15 text-text-primary hover:bg-white/[0.06] active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-sm rounded-2xl gap-2",
  lg: "h-13 px-5 text-base rounded-2xl gap-2",
  icon: "h-11 w-11 rounded-full",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none min-h-[44px]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
