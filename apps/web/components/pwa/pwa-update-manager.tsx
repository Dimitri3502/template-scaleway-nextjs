"use client";

import { Button } from "@acme/ui";
import { useCallback, useEffect, useState } from "react";

import { getTranslations } from "../../i18n";
import { isAppBusy, subscribeToBusy } from "../../lib/app-busy";
import { routes } from "../../routes";

/**
 * Met à jour l'application sans intervention de l'utilisateur, sauf si un travail est en
 * cours (enregistrement, envoi de fichier, brouillon) : dans ce cas la bannière attend.
 */
export function PwaUpdateManager() {
  const t = getTranslations();
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  const applyUpdate = useCallback((worker: ServiceWorker) => {
    worker.postMessage({ type: "SKIP_WAITING" });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.register(routes.serviceWorker).then((registration) => {
      const track = (worker: ServiceWorker | null) => {
        if (!worker) return;
        const check = () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(worker);
          }
        };
        worker.addEventListener("statechange", check);
        check();
      };

      track(registration.waiting);
      registration.addEventListener("updatefound", () => track(registration.installing));
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (!waitingWorker) return;
    if (!isAppBusy()) {
      applyUpdate(waitingWorker);
      return;
    }
    // Un travail est en cours : on réessaie dès qu'il se termine.
    return subscribeToBusy(() => {
      if (!isAppBusy()) applyUpdate(waitingWorker);
    });
  }, [waitingWorker, applyUpdate]);

  if (!waitingWorker) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-border bg-surface-raised px-4 py-3 pb-safe-bottom shadow-overlay">
      <p className="text-sm text-ink">{t("pwa.updateAvailable")}</p>
      <Button size="sm" onClick={() => applyUpdate(waitingWorker)}>
        {t("pwa.update")}
      </Button>
    </div>
  );
}
