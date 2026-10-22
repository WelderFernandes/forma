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
const INSTALLED_KEY = "forma:app-installed-at";
const INSTALLED_FOR_MS = 365 * 24 * 60 * 60 * 1000;

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

type NavigatorWithRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<unknown[]>;
};

type InstallWindow = Window & {
  __formaInstallPrompt?: BeforeInstallPromptEvent | null;
  __formaAppInstalled?: boolean;
};

type InstallAppContextValue = {
  canInstall: boolean;
  isInstalled: boolean;
  isChecking: boolean;
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

function detectMobile(navigator: Navigator) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) !== null;
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Sem localStorage, o banner apenas some nesta sessão.
  }
}

function readInstalledMarker() {
  if ((window as InstallWindow).__formaAppInstalled === true) return true;

  try {
    const raw = window.localStorage.getItem(INSTALLED_KEY);
    if (!raw) return false;

    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      window.localStorage.removeItem(INSTALLED_KEY);
      return false;
    }

    if (Date.now() - timestamp > INSTALLED_FOR_MS) {
      window.localStorage.removeItem(INSTALLED_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function rememberInstalled() {
  (window as InstallWindow).__formaAppInstalled = true;
  try {
    window.localStorage.setItem(INSTALLED_KEY, String(Date.now()));
  } catch {
    // Sem localStorage, o estado em memória continua válido nesta sessão.
  }
}

function readCapturedPrompt() {
  return (window as InstallWindow).__formaInstallPrompt ?? null;
}

async function detectRelatedAppInstalled(nav: NavigatorWithRelatedApps) {
  if (typeof nav.getInstalledRelatedApps !== "function") return null;

  try {
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.length > 0;
  } catch {
    return null;
  }
}

export function InstallAppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [isIOS, setIsIOS] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true);
  const [instructionsOpen, setInstructionsOpen] = React.useState(false);

  React.useEffect(() => {
    const nav = navigator as NavigatorWithStandalone & NavigatorWithRelatedApps;
    const mediaQueries = [
      "standalone",
      "minimal-ui",
      "fullscreen",
      "window-controls-overlay",
    ].map((mode) => window.matchMedia(`(display-mode: ${mode})`));

    let cancelled = false;

    const markInstalled = () => {
      rememberInstalled();
      setIsInstalled(true);
      setIsChecking(false);
    };

    const updateInstalled = () => {
      if (
        nav.standalone === true ||
        mediaQueries.some((query) => query.matches)
      ) {
        markInstalled();
        return;
      }

      setIsInstalled(readInstalledMarker());
      setIsChecking(false);
    };

    const checkRelatedApps = async () => {
      const installed = await detectRelatedAppInstalled(nav);
      if (cancelled || !installed) return;
      markInstalled();
    };

    setIsIOS(detectIOS(nav));
    setIsMobile(detectMobile(nav));
    setIsInAppBrowser(detectInAppBrowser(nav));
    setDismissed(readDismissed());
    setDeferredPrompt(readCapturedPrompt());
    updateInstalled();
    void checkRelatedApps();

    const handleDisplayModeChange = () => updateInstalled();

    mediaQueries.forEach((query) =>
      query.addEventListener("change", handleDisplayModeChange),
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      updateInstalled();
      void checkRelatedApps();
    };

    const handlePageShow = () => {
      updateInstalled();
      void checkRelatedApps();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      cancelled = true;
      mediaQueries.forEach((query) =>
        query.removeEventListener("change", handleDisplayModeChange),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleCapturedPrompt = () => {
      const prompt = readCapturedPrompt();
      if (prompt) setDeferredPrompt(prompt);
    };

    const handleInstalled = () => {
      rememberInstalled();
      rememberDismissed();
      setIsInstalled(true);
      setIsChecking(false);
      setDismissed(true);
      setDeferredPrompt(null);
      setInstructionsOpen(false);
      (window as InstallWindow).__formaInstallPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("forma:installprompt", handleCapturedPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("forma:appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("forma:installprompt", handleCapturedPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("forma:appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    rememberDismissed();
  }, []);

  const promptInstall = React.useCallback(async () => {
    const prompt = deferredPrompt ?? readCapturedPrompt();

    if (!prompt) {
      dismiss();
      setInstructionsOpen(true);
      return;
    }

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setDeferredPrompt(null);
      (window as InstallWindow).__formaInstallPrompt = null;

      if (choice.outcome === "accepted") {
        rememberInstalled();
        rememberDismissed();
        setIsInstalled(true);
        setIsChecking(false);
        setDismissed(true);
      } else {
        dismiss();
      }
    } catch {
      setDeferredPrompt(null);
      (window as InstallWindow).__formaInstallPrompt = null;
      dismiss();
      setInstructionsOpen(true);
    }
  }, [deferredPrompt, dismiss]);

  const openInstructions = React.useCallback(() => {
    dismiss();
    setInstructionsOpen(true);
  }, [dismiss]);

  const value = React.useMemo<InstallAppContextValue>(
    () => ({
      canInstall: Boolean(deferredPrompt),
      isInstalled,
      isChecking,
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
      isChecking,
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
        isMobile={isMobile}
        isInAppBrowser={isInAppBrowser}
      />
    </InstallAppContext.Provider>
  );
}

function InstallInstructionsDialog({
  open,
  onOpenChange,
  isIOS,
  isMobile,
  isInAppBrowser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
  isMobile: boolean;
  isInAppBrowser: boolean;
}) {
  const action = isMobile ? "Toque" : "Clique";

  const steps = isInAppBrowser
    ? [
        `${action} no menu do navegador e escolha “Abrir no Safari” ou “Abrir no Chrome”.`,
        "No navegador, abra o menu de compartilhamento ou instalação.",
        "Escolha “Adicionar à Tela de Início”.",
      ]
    : isIOS
      ? [
          "Abra o Forma no Safari.",
          "Toque no botão Compartilhar.",
          "Escolha “Adicionar à Tela de Início”.",
        ]
      : isMobile
        ? [
            "Abra o Forma no Chrome.",
            "Toque no menu de três pontos.",
            "Escolha “Instalar app” ou “Adicionar à tela de início”.",
          ]
        : [
            "Abra o Forma no Chrome ou Edge.",
            "Clique no menu do navegador (⋮).",
            "Escolha “Instalar app”.",
          ];

  const note = isInAppBrowser
    ? "Navegadores dentro de outros apps não instalam o Forma. Abra no Safari ou no Chrome para continuar."
    : isIOS
      ? "O iPhone não permite instalar direto pelo site. A instalação é feita pelo menu Compartilhar do Safari."
      : isMobile
        ? "A janela de instalação só abre quando o navegador libera a instalação automática. Se ela não aparecer, use o menu acima."
        : "A janela de instalação só abre quando o navegador libera a instalação automática. No Safari do Mac, use Arquivo → Adicionar ao Dock.";

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

        <p className="rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="brand">Entendi</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
