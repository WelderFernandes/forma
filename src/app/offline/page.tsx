import { Dumbbell, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
          O Forma guarda suas fichas e a biblioteca de exercícios no dispositivo.
          Assim que a conexão voltar, tudo sincroniza de novo.
        </p>
      </div>
      <Button asChild variant="brand">
        <Link href="/painel">
          <Dumbbell className="size-4" />
          Ir para o painel
        </Link>
      </Button>
    </div>
  );
}
