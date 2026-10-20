"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Flame, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNav, MOBILE_NAV_ITEMS } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";

export function AppShell({
  children,
  user,
  streak,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
  streak: number;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const isFocusMode = pathname.startsWith("/treino/");

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const week = Array.from({ length: 7 }, (_, i) => i < Math.min(streak, 7));

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[264px_1fr]">
      {/* Sidebar desktop — clube, sempre escura */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-6 pb-7 pt-7">
          <Logo tone="light" />
          <p className="mt-2 pl-[46px] text-[10px] font-medium uppercase tracking-[0.18em] text-cream/30">
            Atelier de treino
          </p>
        </div>

        <div className="scrollbar-none flex-1 overflow-y-auto px-3">
          <SidebarNav />
        </div>

        <div className="p-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-2">
              <Flame className="size-3.5 text-lime" strokeWidth={2} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/40">
                Sequência
              </p>
            </div>
            <p className="mt-2 font-display text-[32px] leading-none text-cream">
              {streak}
              <span className="ml-1.5 font-body text-[11px] font-medium text-cream/45">
                {streak === 1 ? "dia" : "dias"}
              </span>
            </p>
            <div className="mt-3 flex gap-1.5">
              {week.map((filled, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    filled ? "bg-lime" : "bg-white/10",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/70 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="animate-scale-in absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto border-r border-white/10 bg-ink px-4 pb-8 pt-5 text-cream shadow-2xl">
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo tone="light" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar"
                className="text-cream hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        {/* Header fosco */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </Button>

            <div className="lg:hidden">
              <Logo />
            </div>

            <p className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-muted lg:block">
              Seu espaço de treino
            </p>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                asChild
                variant="brand"
                size="sm"
                className={cn(
                  "mr-1 hidden sm:inline-flex",
                  isFocusMode && "sm:hidden",
                )}
              >
                <Link href="/treinos">
                  Treinar agora
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>

              {streak > 0 && (
                <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-border-soft bg-surface px-3 py-1.5 text-[11px] font-semibold text-fg-2 md:inline-flex">
                  <Flame className="size-3.5 text-clay" strokeWidth={2} />
                  {streak} {streak === 1 ? "dia" : "dias"}
                </span>
              )}
              <ThemeToggle />
              <UserMenu name={user.name} email={user.email} />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>

      {/* Navegação mobile — cápsula de tinta */}
      {!isFocusMode && (
        <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
          <div className="safe-bottom mx-auto flex max-w-md items-center gap-1 rounded-[26px] border border-white/10 bg-ink/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl">
            {MOBILE_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-[20px] px-1 py-2 text-[9.5px] font-medium tracking-[-0.01em] transition-colors",
                    active
                      ? "bg-white/[0.08] text-lime"
                      : "text-cream/45 hover:text-cream/80",
                  )}
                >
                  <item.icon
                    className="size-[19px]"
                    strokeWidth={active ? 2.1 : 1.7}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
