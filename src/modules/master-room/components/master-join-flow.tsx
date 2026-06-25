"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Smartphone, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { joinMasterRoomAction } from "@/actions";
import { MEMBER_TOKEN_STORAGE_KEY } from "@/constants";
import { useDeviceStore } from "@/stores";

interface Props {
  masterRoomId: string;
  accessToken: string;
}

const MASTER_NAME_KEY = "master_display_name";

export function MasterJoinFlow({ masterRoomId, accessToken }: Props) {
  const router = useRouter();
  const { deviceId, deviceName } = useDeviceStore();
  const [step, setStep] = useState<"checking" | "input" | "joining">("checking");
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem(MASTER_NAME_KEY);
    if (storedName && storedName.trim()) {
      setSavedName(storedName.trim());
      setDisplayName(storedName.trim());
      setStep("input"); // Wait for user confirmation
    } else {
      setStep("input");
    }
  }, []);

  const handleJoin = useCallback(async (name: string) => {
    if (!deviceId || !name.trim()) return;
    setStep("joining");
    try {
      const result = await joinMasterRoomAction({
        masterRoomId,
        accessToken,
        device: { deviceId, deviceName },
        displayName: name.trim(),
      });

      if (result.success && result.data) {
        localStorage.setItem(MASTER_NAME_KEY, name.trim());
        const participantRoomId = result.data.participantRoomId;

        if (result.data.member?.access_token) {
          localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, result.data.member.access_token);
        }

        toast.success("Berhasil bergabung!");
        router.push(`/workspace/${participantRoomId}`);
      } else {
        toast.error(result.error ?? "Gagal bergabung");
        setStep("input");
      }
    } catch {
      toast.error("Terjadi kesalahan");
      setStep("input");
    }
  }, [deviceId, deviceName, masterRoomId, accessToken, router]);

  const handleSubmit = () => {
    if (displayName.trim()) {
      handleJoin(displayName.trim());
    }
  };

  if (step === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Gabung Room Master</CardTitle>
          <CardDescription>
            {savedName
              ? `Nama tersimpan: ${savedName}. Klik gabung untuk melanjutkan.`
              : "Masukkan nama Anda untuk bergabung sebagai participant"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nama Anda</Label>
              <Input
                id="name"
                placeholder="Masukkan nama..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                disabled={step === "joining"}
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={!displayName.trim() || step === "joining"}
            >
              {step === "joining" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bergabung...
                </>
              ) : (
                <>
                  {savedName ? "Gabung" : "Gabung"}
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
