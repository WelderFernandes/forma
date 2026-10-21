"use client";

import * as React from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let shouldReload = false;
    let cancelled = false;

    const promptUpdate = (registration: ServiceWorkerRegistration) => {
      toast("Nova versão do Forma disponível", {
        id: "sw-update",
        description: "Atualize para carregar as melhorias mais recentes.",
        duration: 12000,
        action: {
          label: "Atualizar",
          onClick: () => {
            shouldReload = true;
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            } else {
              window.location.reload();
            }
          },
        },
      });
    };

    const onControllerChange = () => {
      if (!shouldReload) return;
      shouldReload = false;
      window.location.reload();
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (cancelled) return;

        navigator.serviceWorker.addEventListener(
          "controllerchange",
          onControllerChange,
        );

        if (registration.waiting) {
          promptUpdate(registration);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              promptUpdate(registration);
            }
          });
        });
      } catch {
        // O app continua funcionando normalmente sem suporte a PWA.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
