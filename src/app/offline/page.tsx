import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { OfflineRetry } from "@/components/offline-retry";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        <WifiOff className="size-6" />
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Você está offline
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          O Forma precisa de conexão para carregar seus treinos e dados.
          Verifique sua internet e tente novamente.
        </p>
      </div>
      <OfflineRetry />
      <p className="text-xs text-muted-foreground/70">
        Seus dados continuam salvos no servidor.
      </p>
    </div>
  );
}
