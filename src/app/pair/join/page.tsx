"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { joinPairSessionAction } from "@/actions";
import { MEMBER_TOKEN_STORAGE_KEY } from "@/constants";
import { Header } from "@/components/layouts/header";
import { useDeviceStore } from "@/stores";

function PairJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { deviceId, deviceName, initDevice } = useDeviceStore();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    initDevice();
  }, [initDevice]);

  useEffect(() => {
    async function join() {
      if (!token) {
        setStatus("error");
        setErrorMsg("Invalid pairing link. No token provided.");
        return;
      }

      if (!deviceId) return;

      const result = await joinPairSessionAction(token, {
        deviceId,
        deviceName,
      });

      if (result.success && result.data) {
        localStorage.setItem(
          MEMBER_TOKEN_STORAGE_KEY,
          result.data.guestMember.access_token,
        );
        toast.success("Paired successfully!");
        router.replace(`/workspace/${result.data.room.id}`);
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Failed to join pairing session");
      }
    }

    join();
  }, [token, deviceId, deviceName, router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {status === "loading" ? (
        <>
          <div className="mb-4 h-8 w-8 animate-spin rounded-md border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Connecting devices...</p>
        </>
      ) : (
        <>
          <p className="mb-4 text-destructive">{errorMsg}</p>
          <a href="/pair" className="text-sm text-primary hover:underline">
            Start a new pairing session
          </a>
        </>
      )}
    </div>
  );
}

export default function PairJoinPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-md border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          <PairJoinContent />
        </Suspense>
      </main>
    </div>
  );
}
