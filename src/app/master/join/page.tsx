"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MasterJoinFlow } from "@/modules/master-room/components/master-join-flow";
import { getMasterRoomByCodeAction } from "@/actions";

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<{ roomId: string; token: string } | null>(null);
  const [code, setCode] = useState("");
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const token = searchParams.get("token");

    if (roomId && token) {
      setParams({ roomId, token });
    }
  }, [searchParams]);

  const handleFindByCode = async () => {
    const cleaned = code.toUpperCase().replace(/\s/g, "");
    if (!cleaned) return;

    setFinding(true);
    setError(null);
    try {
      const result = await getMasterRoomByCodeAction(cleaned);
      if (result.success && result.data) {
        setParams({ roomId: result.data.roomId, token: result.data.accessToken });
      } else {
        setError(result.error ?? "Room tidak ditemukan");
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setFinding(false);
    }
  };

  if (error && !params) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Gagal Bergabung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setError(null)}>
                Coba Lagi
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (params) {
    return <MasterJoinFlow masterRoomId={params.roomId} accessToken={params.token} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Gabung Room Master</CardTitle>
          <CardDescription>
            Masukkan kode room yang diberikan oleh host
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFindByCode();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="code">Kode Room</Label>
              <Input
                id="code"
                placeholder="PAIR-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-wider text-center"
                autoFocus
                disabled={finding}
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={finding || !code.trim()}
            >
              {finding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencari...
                </>
              ) : (
                <>
                  Cari Room
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
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
