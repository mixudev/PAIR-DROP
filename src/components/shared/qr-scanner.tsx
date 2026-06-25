"use client";

import { useEffect, useState, useRef } from "react";

export function QRScannerInline({ onScan }: { onScan: (data: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const runningRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const instance = new Html5Qrcode("qr-reader");

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (mounted) {
              instance.stop().catch(() => {});
              runningRef.current = false;
              onScanRef.current(decodedText);
            }
          },
          undefined,
        );

        if (!mounted) {
          instance.stop().catch(() => {});
          return;
        }

        scannerRef.current = instance;
        runningRef.current = true;
        setScanning(true);
        setError(null);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Camera access denied");
          setScanning(false);
        }
      }
    };

    start();

    return () => {
      mounted = false;
      if (runningRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        runningRef.current = false;
      }
    };
  }, []);

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
