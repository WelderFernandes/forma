"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleSignOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/entrar");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-full border border-border-soft bg-surface p-0.5 pr-2 transition-colors hover:border-foreground/20",
            "focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none",
          )}
          aria-label="Menu do usuário"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-lime dark:bg-lime dark:text-lime-ink">
            {initials || <User className="size-4" />}
          </span>
          <span className="hidden max-w-28 truncate text-[13px] font-medium sm:inline">
            {name.split(" ")[0]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
          <span className="text-[13px] font-semibold">{name}</span>
          <span className="truncate text-xs font-normal text-muted">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracoes">
            <Settings className="size-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/progresso">
            <User className="size-4" />
            Meu progresso
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleSignOut}
          disabled={loading}
          className="text-danger focus:bg-danger/10 focus:text-danger"
        >
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
