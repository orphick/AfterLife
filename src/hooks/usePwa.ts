import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaState {
  canInstall: boolean;
  hasUpdate: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
  refreshApp: () => void;
}

export function usePwa(onToast: (message: string) => void): PwaState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia?.("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && window.navigator.standalone === true)
  );

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      onToast("AfterLife installed.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [onToast]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    const markReady = (worker: ServiceWorker) => {
      setWaitingWorker(worker);
      onToast("A new version is ready.");
    };

    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          markReady(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              markReady(newWorker);
            }
          });
        });
      })
      .catch(() => {
        // Service workers are unavailable under file:// and some embedded modes.
      });

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [onToast]);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      onToast("Install will appear when the browser allows it.");
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      onToast("Install started.");
    }
  }, [deferredPrompt, onToast]);

  const refreshApp = useCallback(() => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return {
    canInstall: Boolean(deferredPrompt),
    hasUpdate: Boolean(waitingWorker),
    isStandalone,
    installApp,
    refreshApp
  };
}
