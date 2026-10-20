import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inputs Forma — superfície quente, hairline e foco citron.
 * A borda conduz; o preenchimento é discreto para o conteúdo dominar.
 */

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-border bg-surface/70 px-4 py-3 text-[15px] font-body text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-[border-color,box-shadow,background-color] duration-200",
      "placeholder:text-muted/70",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "hover:border-meta/60",
      "focus-visible:border-lime focus-visible:bg-surface focus-visible:ring-4 focus-visible:ring-lime/25 focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-24 w-full rounded-2xl border border-border bg-surface/70 px-4 py-3.5 text-[15px] font-body text-foreground transition-[border-color,box-shadow] duration-200",
      "placeholder:text-muted/70",
      "hover:border-meta/60",
      "focus-visible:border-lime focus-visible:ring-4 focus-visible:ring-lime/25 focus-visible:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
