"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Brain,
  Calculator,
  Dumbbell,
  LayoutGrid,
  Salad,
  Scale,
  Settings,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Treinar",
    items: [
      { href: "/painel", label: "Painel", icon: LayoutGrid },
      { href: "/treinos", label: "Treinos", icon: Dumbbell },
      { href: "/exercicios", label: "Exercícios", icon: BookOpen },
    ],
  },
  {
    label: "Acompanhar",
    items: [
      { href: "/progresso", label: "Progresso", icon: Activity },
      { href: "/corpo", label: "Corpo", icon: Scale },
      { href: "/nutricao", label: "Nutrição", icon: Salad },
    ],
  },
  {
    label: "Descobrir",
    items: [
      { href: "/calculadoras", label: "Calculadoras", icon: Calculator },
      { href: "/desafios", label: "Desafios", icon: Trophy },
      { href: "/mentalidade", label: "Mentalidade", icon: Brain },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[5],
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/35">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium tracking-[-0.01em] transition-colors duration-200",
                    active
                      ? "bg-white/[0.07] text-lime"
                      : "text-cream/60 hover:bg-white/[0.045] hover:text-cream",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-lime" />
                  )}
                  <item.icon
                    className="size-[17px] shrink-0"
                    strokeWidth={active ? 2.1 : 1.7}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-1 border-t border-white/10 pt-4">
        <Link
          href="/configuracoes"
          onClick={onNavigate}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200",
            isActive(pathname, "/configuracoes")
              ? "bg-white/[0.07] text-lime"
              : "text-cream/60 hover:bg-white/[0.045] hover:text-cream",
          )}
        >
          <Settings className="size-[17px] shrink-0" strokeWidth={1.7} />
          Configurações
        </Link>
      </div>
    </nav>
  );
}
