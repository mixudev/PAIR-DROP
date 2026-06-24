"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Smartphone } from "lucide-react";
import { createPairSessionAction, getMemberByDeviceAction } from "@/actions";
import { MEMBER_TOKEN_STORAGE_KEY } from "@/constants";
import { EmptyState } from "@/components/shared/empty-state";
import { PairQRDisplay } from "@/modules/pair-session/components/pair-qr-display";
import { usePairSessionRealtime } from "@/hooks/use-realtime";
import { useDeviceStore } from "@/stores";
import type { PairSession } from "@/types";

export function PairSessionView() {
  const router = useRouter();
  const { deviceId } = useDeviceStore();
  const [session, setSession] = useState<PairSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const createSession = useCallback(async () => {
    if (!deviceId) return;
    setIsRefreshing(true);
    const result = await createPairSessionAction(deviceId);
    if (result.success && result.data) {
      setSession(result.data);
    } else {
      toast.error(result.error ?? "Failed to create pairing session");
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) createSession();
  }, [deviceId, createSession]);

  const handleConnected = useCallback(
    async (roomId: string) => {
      const memberResult = await getMemberByDeviceAction(roomId, deviceId);
      if (memberResult.success && memberResult.data) {
        localStorage.setItem(
          MEMBER_TOKEN_STORAGE_KEY,
          memberResult.data.access_token,
        );
      }
      toast.success("Device paired successfully!");
      router.push(`/workspace/${roomId}`);
    },
    [router, deviceId],
  );

  usePairSessionRealtime(session?.id ?? null, handleConnected);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-md border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        icon={Smartphone}
        title="Unable to create session"
        description="Please refresh the page to try again"
        action={{ label: "Retry", onClick: createSession }}
      />
    );
  }

  return (
    <PairQRDisplay
      session={session}
      onRefresh={createSession}
      isRefreshing={isRefreshing}
    />
  );
}
