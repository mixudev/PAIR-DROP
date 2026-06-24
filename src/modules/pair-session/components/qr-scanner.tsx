"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface QRScannerProps {
  onScan: (data: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container";

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {},
      );
    } catch (err) {
      setIsScanning(false);
      const message =
        err instanceof Error ? err.message : "Camera access denied";
      setError(
        message.includes("NotAllowed")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : message.includes("NotFound")
            ? "No camera found on this device."
            : `Camera error: ${message}`,
      );
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scan QR Code</CardTitle>
        <CardDescription>Use your camera to scan a pairing or room QR code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          id={containerId}
          className={`overflow-hidden rounded-md border border-border ${isScanning ? "block" : "hidden"}`}
        />
        {!isScanning && (
          <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button
          variant={isScanning ? "destructive" : "default"}
          className="w-full"
          onClick={isScanning ? stopScanner : startScanner}
        >
          {isScanning ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
