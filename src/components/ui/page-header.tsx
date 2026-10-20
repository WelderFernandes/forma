import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cabeçalho editorial padrão das páginas internas.
 * Eyebrow em caixa alta, título serifado e descrição curta.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow text-muted">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-[clamp(2rem,4vw,3.1rem)] leading-[0.98] text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
