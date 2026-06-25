"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

function getBrowser(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/Edg/.test(ua)) return "Edge";
  if (/Chrome/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  if (/Firefox/.test(ua)) return "Firefox";
  return "";
}

const INSTALL_GUIDES: Record<string, string> = {
  Chrome: "Klik ⋮ (menu) → 'Install PairDrop' atau 'Pasang PairDrop'",
  Edge: "Klik ⋯ (menu) → 'Apps' → 'Install this site as an app'",
  Safari: "Klik ikon Share (□↑) → 'Add to Home Screen'",
  Firefox: "Buka menggunakan Chrome atau Edge untuk instalasi PWA",
};

export function InstallPWAButton({ variant = "ghost" }: { variant?: "ghost" | "outline" | "default" }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("PairDrop berhasil diinstall!");
        setInstallPrompt(null);
        setIsInstalled(true);
      }
    } else {
      const browser = getBrowser();
      const guide = INSTALL_GUIDES[browser] ?? "Gunakan Chrome atau Edge untuk instalasi aplikasi";
      toast.info(guide, { duration: 6000 });
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <div className="flex items-center gap-1">
      <Button
        id="install-pwa-btn"
        variant={variant}
        size="sm"
        className="gap-2"
        onClick={handleInstall}
        title="Install PairDrop sebagai aplikasi"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setIsDismissed(true)}
        title="Tutup"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function InstallPWABanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) { setDismissed(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isInstalled || dismissed || !installPrompt) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("PairDrop berhasil diinstall!");
      setInstallPrompt(null);
    }
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            P
          </div>
          <div>
            <p className="text-sm font-medium">Install PairDrop</p>
            <p className="text-xs text-muted-foreground">Tambahkan ke layar utama</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
            Install
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              sessionStorage.setItem("pwa-banner-dismissed", "1");
              setDismissed(true);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
