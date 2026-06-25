"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterJoinFlow } from "@/modules/master-room/components/master-join-flow";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<{ roomId: string; token: string } | null>(null);

  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const token = searchParams.get("token");

    if (!roomId || !token) {
      setError("Invalid join link: missing room ID or token");
      return;
    }

    setParams({ roomId, token });
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!params) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <MasterJoinFlow masterRoomId={params.roomId} accessToken={params.token} />;
}

export default function MasterJoinPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
