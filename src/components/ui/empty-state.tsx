import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[26px] border border-dashed border-border bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-full border border-border bg-card text-muted shadow-card">
        <Icon className="size-6" strokeWidth={1.6} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="font-body text-[17px] font-semibold tracking-[-0.02em]">
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
