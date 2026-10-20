import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  delta,
  deltaLabel,
  accent = "default",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
  accent?: "default" | "brand" | "accent";
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  const highlighted = accent === "brand" || accent === "accent";

  return (
    <Card
      variant={highlighted ? "lime" : "default"}
      hoverable={false}
      className={cn("overflow-hidden p-5", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "eyebrow pt-1",
            highlighted ? "text-lime-ink/65" : "text-muted",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full border",
            highlighted
              ? "border-lime-ink/15 bg-lime-ink/10 text-lime-ink"
              : "border-border-soft bg-surface text-fg-2",
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-[44px] leading-[0.85] tracking-[-0.03em]",
            highlighted ? "text-lime-ink" : "text-foreground",
          )}
        >
          {value}
        </span>
        {unit && (
          <span
            className={cn(
              "text-xs font-medium",
              highlighted ? "text-lime-ink/65" : "text-muted",
            )}
          >
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p
          className={cn(
            "truncate text-xs",
            highlighted ? "text-lime-ink/65" : "text-muted",
          )}
        >
          {deltaLabel ?? hint}
        </p>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              highlighted
                ? "bg-lime-ink/10 text-lime-ink"
                : positive
                  ? "bg-success/12 text-success"
                  : "bg-danger/12 text-danger",
            )}
          >
            {positive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
    </Card>
  );
}
