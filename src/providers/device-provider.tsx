"use client";

import { useEffect } from "react";
import { useDeviceStore } from "@/stores";

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const initDevice = useDeviceStore((s) => s.initDevice);

  useEffect(() => {
    initDevice();
  }, [initDevice]);

  return <>{children}</>;
}
