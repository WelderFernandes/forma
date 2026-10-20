import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  tone = "auto",
  className,
}: {
  href?: string;
  tone?: "auto" | "light" | "dark";
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Forma — início"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-lime text-lime-ink shadow-[0_6px_18px_-8px_rgba(180,215,60,0.8)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-rotate-6">
        <span className="font-display text-[23px] leading-none">f</span>
      </span>
      <span
        className={cn(
          "font-display text-[27px] leading-none tracking-[-0.035em]",
          tone === "light" && "text-cream",
          tone === "dark" && "text-foreground",
          tone === "auto" && "text-foreground dark:text-cream",
        )}
      >
        forma
        <span className="ml-0.5 align-super text-[9px] tracking-normal opacity-60">
          ®
        </span>
      </span>
    </Link>
  );
}
