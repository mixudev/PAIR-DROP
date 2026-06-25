"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, ArrowRight, Scan } from "lucide-react";
import { joinRoomAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEMBER_TOKEN_STORAGE_KEY, getRoomTokenKey } from "@/constants";
import { useDeviceStore, useWorkspaceStore } from "@/stores";

export function JoinRoomForm() {
  const router = useRouter();
  const { deviceId, deviceName } = useDeviceStore();
  const resetWorkspace = useWorkspaceStore((s) => s.reset);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    resetWorkspace();
  }, [resetWorkspace]);

  const joinRoom = useCallback(async (roomCode: string) => {
    if (!deviceId) {
      toast.error("Device not initialized");
      return;
    }
    setIsLoading(true);
    try {
      const result = await joinRoomAction({
        code: roomCode.toUpperCase().replace(/\s/g, ""),
        device: { deviceId, deviceName },
      });

      if (result.success && result.data) {
        const roomId = result.data.room.id;
        const token = result.data.member.access_token;
        localStorage.setItem(getRoomTokenKey(roomId), token);
        localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token);
        toast.success(`Joined ${result.data.room.name}`);
        router.push(`/workspace/${roomId}`);
      } else {
        toast.error(result.error ?? "Failed to join room");
      }
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, deviceName, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    await joinRoom(code);
  };

  const handleQRScan = useCallback((scanned: string) => {
    setScannerOpen(false);
    try {
      const url = new URL(scanned);
      const token = url.searchParams.get("token");
      const roomCode = url.searchParams.get("code");
      const pathParts = url.pathname.split("/");
      const workspaceIdx = pathParts.indexOf("workspace");

      // Workspace URL with access token (from settings QR)
      if (typeof token === "string" && token.length > 0 && workspaceIdx !== -1) {
        const roomId = pathParts[workspaceIdx + 1];
        if (typeof roomId === "string" && roomId.length > 0) {
          try { localStorage.setItem(getRoomTokenKey(roomId), token); } catch {}
          try { localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token); } catch {}
          router.push(`/workspace/${roomId}`);
          return;
        }
      }

      // Pair session token
      if (typeof token === "string" && token.length > 0) {
        router.push(`/pair/join?token=${encodeURIComponent(token)}`);
        return;
      }

      // Room join code
      if (typeof roomCode === "string" && roomCode.length > 0) {
        joinRoom(roomCode);
        return;
      }

      // Plain workspace URL (no token)
      if (workspaceIdx !== -1) {
        const roomId = pathParts[workspaceIdx + 1];
        if (typeof roomId === "string" && roomId.length > 0) {
          router.push(`/workspace/${roomId}`);
          return;
        }
      }

      toast.error("Unrecognized QR code format");
    } catch {
      joinRoom(scanned);
    }
  }, [router, joinRoom]);

  return (
    <>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Gabung Room</CardTitle>
          <CardDescription>
            Masukkan kode room atau scan QR untuk bergabung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Room</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="PAIR-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setScannerOpen(true)}
                  title="Scan QR Code"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? "Joining..." : "Gabung Room"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <QRScannerInline onScan={handleQRScan} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function QRScannerInline({ onScan }: { onScan: (data: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopScanner: (() => Promise<void>) | null = null;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const instance = new Html5Qrcode("qr-reader");
        stopScanner = () => instance.stop();
        await instance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            instance.stop().catch(() => {});
            onScan(decodedText);
          },
          undefined,
        );
        setScanning(true);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Camera access denied");
        setScanning(false);
      }
    };

    start();

    return () => {
      stopScanner?.().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div id="qr-reader" className="w-full max-w-[300px] rounded-lg overflow-hidden" />
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
      {!error && !scanning && (
        <p className="text-sm text-muted-foreground">Mengakses kamera...</p>
      )}
      {scanning && (
        <p className="text-sm text-muted-foreground">
          Arahkan kamera ke QR code room
        </p>
      )}
    </div>
  );
}
