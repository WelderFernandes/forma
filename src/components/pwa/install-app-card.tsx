"use client";

import {
  CheckCircle2,
  Download,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInstallApp } from "@/components/pwa/install-app-provider";

export function InstallAppBanner() {
  const {
    canInstall,
    dismissed,
    dismiss,
    isInAppBrowser,
    isInstalled,
    promptInstall,
  } = useInstallApp();

  if (isInstalled || dismissed) return null;

  return (
    <Card variant="feature" className="md:hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime/15 text-lime">
            <Download className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-body text-[15px] font-semibold text-cream">
              Leve o Forma com você
            </p>
            <p className="text-[13px] leading-relaxed text-cream/60">
              Instale na tela de início para abrir mais rápido e em tela cheia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="brand"
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => void promptInstall()}
          >
            {canInstall
              ? "Instalar"
              : isInAppBrowser
                ? "Como abrir"
                : "Como instalar"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Agora não"
            onClick={dismiss}
            className="text-cream/60 hover:bg-white/10 hover:text-cream"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function InstallAppSettingsCard() {
  const {
    canInstall,
    isInAppBrowser,
    isInstalled,
    isIOS,
    openInstructions,
    promptInstall,
  } = useInstallApp();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Aplicativo</CardTitle>
          <CardDescription>
            Tenha o Forma na tela de início do celular.
          </CardDescription>
        </div>
        <Badge variant={isInstalled ? "success" : "outline"}>
          {isInstalled ? "Instalado" : "Instalável"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            {isInstalled ? (
              <CheckCircle2 className="size-4" />
            ) : isIOS ? (
              <Share className="size-4" />
            ) : (
              <Smartphone className="size-4" />
            )}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isInstalled
                ? "Forma instalado"
                : "Instalar na tela de início"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isInstalled
                ? "Você está usando o Forma como aplicativo. Pode abrir pelo ícone na tela de início."
                : isInAppBrowser
                  ? "Você está em um navegador dentro de outro app. Abra no Safari ou Chrome para instalar."
                  : "Abre em tela cheia, com o mesmo login e os mesmos dados."}
            </p>
          </div>
        </div>

        {!isInstalled && (
          <div className="flex flex-wrap items-center gap-2">
            {canInstall ? (
              <Button variant="brand" onClick={() => void promptInstall()}>
                <Download className="size-4" />
                Instalar app
              </Button>
            ) : (
              <Button variant="outline" onClick={openInstructions}>
                <Smartphone className="size-4" />
                {isIOS ? "Como instalar no iPhone" : "Como instalar"}
              </Button>
            )}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          A instalação não cria outra conta nem separa seus dados. O app usa a
          mesma sessão e o mesmo servidor do Forma.
        </p>
      </CardContent>
    </Card>
  );
}
