"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { joinRoomAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRScanner } from "@/modules/pair-session/components/qr-scanner";
import { MEMBER_TOKEN_STORAGE_KEY } from "@/constants";
import { useDeviceStore } from "@/stores";

const schema = z.object({
  code: z.string().min(4, "Enter a valid room code"),
});

type FormData = z.infer<typeof schema>;

export function JoinRoomForm() {
  const router = useRouter();
  const { deviceId, deviceName } = useDeviceStore();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const joinRoom = async (code: string) => {
    if (!deviceId) {
      toast.error("Device not initialized");
      return;
    }

    const result = await joinRoomAction({
      code: code.toUpperCase().replace(/\s/g, ""),
      device: { deviceId, deviceName },
    });

    if (result.success && result.data) {
      localStorage.setItem(
        MEMBER_TOKEN_STORAGE_KEY,
        result.data.member.access_token,
      );
      toast.success(`Joined ${result.data.room.name}`);
      router.push(`/workspace/${result.data.room.id}`);
    } else {
      toast.error(result.error ?? "Failed to join room");
    }
  };

  const onSubmit = async (data: FormData) => {
    await joinRoom(data.code);
  };

  const handleQRScan = (data: string) => {
    try {
      const url = new URL(data);
      const token = url.searchParams.get("token");
      const roomCode = url.searchParams.get("code");

      if (token) {
        router.push(`/pair/join?token=${token}`);
        return;
      }
      if (roomCode) {
        joinRoom(roomCode);
        return;
      }

      const pathParts = url.pathname.split("/");
      const workspaceIdx = pathParts.indexOf("workspace");
      if (workspaceIdx !== -1 && pathParts[workspaceIdx + 1]) {
        router.push(`/workspace/${pathParts[workspaceIdx + 1]}`);
        return;
      }

      toast.error("Unrecognized QR code format");
    } catch {
      joinRoom(data);
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Enter Room Code</CardTitle>
          <CardDescription>
            Enter a code like LAZ-4827 to join an existing room
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Room Code</Label>
              <Input
                id="code"
                placeholder="LAZ-4827"
                className="font-mono text-lg tracking-wider"
                {...register("code")}
                onChange={(e) =>
                  setValue("code", e.target.value.toUpperCase())
                }
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Room"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <QRScanner onScan={handleQRScan} />
    </div>
  );
}
