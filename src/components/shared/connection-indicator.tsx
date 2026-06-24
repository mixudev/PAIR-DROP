"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/constants";

const statusConfig: Record<
  ConnectionStatus,
  { label: string; color: string; pulse: boolean }
> = {
  connected: { label: "Connected", color: "bg-emerald-500", pulse: true },
  waiting: { label: "Waiting for Pairing", color: "bg-amber-500", pulse: true },
  disconnected: { label: "Disconnected", color: "bg-red-500", pulse: false },
};

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
}

export function ConnectionIndicator({
  status,
  className,
}: ConnectionIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn("absolute inline-flex h-full w-full rounded-full", config.color)}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.color)} />
      </span>
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
