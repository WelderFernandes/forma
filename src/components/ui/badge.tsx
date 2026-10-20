import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badges Forma — cápsula pequena, tinta ou superfície semântica.
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px] text-[11px] font-body font-medium leading-none tracking-[0.01em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-surface-warm text-fg-2",
        brand: "border-transparent bg-brand-soft text-brand",
        accent: "border-transparent bg-brand-soft text-brand",
        outline: "border-border bg-transparent text-fg-2",
        success:
          "border-transparent bg-success/12 text-success dark:bg-success/15",
        warning:
          "border-transparent bg-warn/12 text-warn dark:bg-warn/15",
        danger:
          "border-transparent bg-danger/12 text-danger dark:bg-danger/15",
        info: "border-transparent bg-accent/10 text-fg-2 dark:bg-white/10",
        muted:
          "border-transparent bg-foreground/[0.055] text-muted dark:bg-white/[0.07]",
        lime: "border-transparent bg-lime text-lime-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
