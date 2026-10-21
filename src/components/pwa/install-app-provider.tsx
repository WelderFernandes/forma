"use client";

import * as React from "react";
import { MoreVertical, Share, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "forma:install-dismissed-at";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type InstallAppContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isInAppBrowser: boolean;
  dismissed: boolean;
  promptInstall: () => Promise<void>;
  openInstructions: () => void;
  dismiss: () => void;
};

const InstallAppContext = React.createContext<InstallAppContextValue | null>(
  null,
);

export function useInstallApp() {
  const context = React.useContext(InstallAppContext);
  if (!context) {
    throw new Error("useInstallApp precisa estar dentro de InstallAppProvider.");
  }
  return context;
}

function detectIOS(navigator: NavigatorWithStandalone) {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function detectInAppBrowser(navigator: Navigator) {
  return /FBAN|FBAV|FB_IAB|Instagram|Line|WhatsApp|Twitter|LinkedIn/i.test(
    navigator.userAgent,
  );
}

export function InstallAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);

  React.useEffect(() => {
    const nav = navigator as NavigatorWithStandalone;
    const displayMode = window.matchMedia("(display-mode: standalone)");

    const detectInstalled = () => {
      setIsInstalled(displayMode.matches || nav.standalone === true);
    };

    setIsIOS(detectIOS(nav));
    setIsInAppBrowser(detectInAppBrowser(nav));
    detectInstalled();

    displayMode.addEventListener("change", detectInstalled);

    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      const timestamp = raw ? Number(raw) : 0;
      const recentlyDismissed =
        Number.isFinite(timestamp) &&
        timestamp > 0 &&
        Date.now() - timestamp < DISMISS_FOR_MS;

      setDismissed(recentlyDismissed);
      if (raw && !recentlyDismissed) {
        window.localStorage.removeItem(DISMISS_KEY);
      }
    } catch {
      setDismissed(false);
    }

    return () => {
      displayMode.removeEventListener("change", detectInstalled);
    };
  }, []);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Sem localStorage, o banner apenas some nesta sessão.
    }
  }, []);

  const promptInstall = React.useCallback(async () => {
    const prompt = deferredPrompt;
    if (!prompt) {
      setInstructionsOpen(true);
      return;
    }

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setDeferredPrompt(null);

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      } else {
        dismiss();
      }
    } catch {
      setInstructionsOpen(true);
    }
  }, [deferredPrompt, dismiss]);

  const openInstructions = React.useCallback(() => {
    setInstructionsOpen(true);
  }, []);

  const value = React.useMemo<InstallAppContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt),
      isInstalled,
      isIOS,
      isInAppBrowser,
      dismissed,
      promptInstall,
      openInstructions,
      dismiss,
    }),
    [
      deferredPrompt,
      dismissed,
      dismiss,
      isInAppBrowser,
      isInstalled,
      isIOS,
      openInstructions,
      promptInstall,
    ],
  );

  return (
    <InstallAppContext.Provider value={value}>
      {children}
      <InstallInstructionsDialog
        open={instructionsOpen}
        onOpenChange={setInstructionsOpen}
        isIOS={isIOS}
        isInAppBrowser={isInAppBrowser}
      />
    </InstallAppContext.Provider>
  );
}

function InstallInstructionsDialog({
  open,
  onOpenChange,
  isIOS,
  isInAppBrowser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
  isInAppBrowser: boolean;
}) {
  const steps = isInAppBrowser
    ? [
        "Toque no menu do navegador e escolha “Abrir no Safari” ou “Abrir no Chrome”.",
        "No navegador, abra o menu de compartilhamento ou instalação.",
        "Escolha “Adicionar à Tela de Início”.",
      ]
    : isIOS
      ? [
          "Abra o Forma no Safari.",
          "Toque no botão Compartilhar.",
          "Escolha “Adicionar à Tela de Início”.",
        ]
      : [
          "Abra o Forma no Chrome.",
          "Toque no menu de três pontos.",
          "Escolha “Instalar app” ou “Adicionar à tela de início”.",
        ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            {isIOS ? (
              <Share className="size-5" />
            ) : isInAppBrowser ? (
              <MoreVertical className="size-5" />
            ) : (
              <Smartphone className="size-5" />
            )}
          </span>
          <DialogTitle>Instalar o Forma</DialogTitle>
          <DialogDescription>
            O app usa a mesma conta e os mesmos dados. Depois de instalar, é só
            abrir pelo ícone na tela de início.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-[11px] font-bold text-lime-ink">
                {index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed text-fg-2">{step}</p>
            </li>
          ))}
        </ol>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="brand">Entendi</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
