"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionIndicator } from "@/components/shared/connection-indicator";
import { env } from "@/config/env";
import type { PairSession } from "@/types";

interface PairQRDisplayProps {
  session: PairSession;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function PairQRDisplay({
  session,
  onRefresh,
  isRefreshing,
}: PairQRDisplayProps) {
  const pairUrl = `${env.appUrl}/pair/join?token=${session.token}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Scan to Pair</CardTitle>
          <CardDescription>
            Scan this QR code with your mobile device to connect instantly
          </CardDescription>
          <ConnectionIndicator status="waiting" className="justify-center pt-2" />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-md border border-border bg-white p-4">
            <QRCodeSVG
              value={pairUrl}
              size={200}
              level="H"
              includeMargin
              fgColor="#171717"
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Expires in {env.pairSessionExpiryMinutes} minutes · One-time use
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Generate New QR
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
