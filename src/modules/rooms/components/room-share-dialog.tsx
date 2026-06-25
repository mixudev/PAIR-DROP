"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, QrCode, Check, Link2, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RoomShareDialogProps {
  roomId: string;
  roomCode: string;
  roomName?: string | null;
  children: React.ReactNode;
}

export function RoomShareDialog({
  roomCode,
  roomName,
  children,
}: RoomShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const roomUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/join?code=${roomCode}`
      : `/room/join?code=${roomCode}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomUrl)}&bgcolor=ffffff&color=000000&margin=10&format=png`;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCodeCopied(true);
    toast.success("Kode room disalin!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setLinkCopied(true);
    toast.success("Link room disalin!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: roomName ? `PairDrop Room: ${roomName}` : "PairDrop Room",
          text: `Gabung ke room PairDrop dengan kode: ${roomCode}`,
          url: roomUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Bagikan Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Room Name */}
          {roomName && (
            <p className="text-sm text-muted-foreground">
              Bagikan akses ke <strong>{roomName}</strong>
            </p>
          )}

          {/* Room Code */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Kode Room
            </p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-center rounded-lg border border-border bg-muted/50 px-4 py-3">
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">
                  {roomCode}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Link Undangan
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={roomUrl}
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <button
              onClick={() => setShowQR((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                QR Code
              </span>
              <span className="text-xs text-muted-foreground">
                {showQR ? "Sembunyikan" : "Tampilkan"}
              </span>
            </button>

            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center rounded-xl border border-border bg-white p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt={`QR Code untuk room ${roomCode}`}
                      width={200}
                      height={200}
                      className="rounded-lg"
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Scan untuk langsung gabung ke room ini
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Share button */}
          {"share" in navigator && (
            <Button
              variant="default"
              className="w-full"
              onClick={handleNativeShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Bagikan via Apps
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
