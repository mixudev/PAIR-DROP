"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { QrCode, KeyRound, ArrowLeft } from "lucide-react";
import { createRoomAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PairSessionView } from "@/modules/pair-session/components/pair-session-view";
import { MEMBER_TOKEN_STORAGE_KEY, getRoomTokenKey, ROOM_EXPIRY_OPTIONS } from "@/constants";
import { useDeviceStore, useWorkspaceStore } from "@/stores";

const schema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  isPublic: z.boolean(),
  expiryHours: z.number(),
  customCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Mode = "select" | "code" | "pair";

function RoomCodeForm() {
  const router = useRouter();
  const { deviceId, deviceName } = useDeviceStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      isPublic: false,
      expiryHours: 24,
      customCode: "",
    },
  });

  const isPublic = watch("isPublic");
  const expiryHours = watch("expiryHours");

  const onSubmit = async (data: FormData) => {
    if (!deviceId) {
      toast.error("Device not initialized");
      return;
    }

    const result = await createRoomAction({
      ...data,
      customCode: data.customCode || undefined,
      device: { deviceId, deviceName },
    });

    if (result.success && result.data) {
      const roomId = result.data.room.id;
      const token = result.data.member.access_token;
      localStorage.setItem(getRoomTokenKey(roomId), token);
      localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token);
      toast.success(`Room ${result.data.room.code} created!`);
      router.push(`/workspace/${roomId}`);
    } else {
      toast.error(result.error ?? "Failed to create room");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Room Name</Label>
        <Input id="name" placeholder="My Workspace" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customCode">Custom Code (optional)</Label>
        <Input
          id="customCode"
          placeholder="PAIR-1234"
          {...register("customCode")}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border p-3">
        <div>
          <Label>Public Room</Label>
          <p className="text-xs text-muted-foreground">
            Anyone with the code can join
          </p>
        </div>
        <Switch
          checked={isPublic}
          onCheckedChange={(v) => setValue("isPublic", v)}
        />
      </div>

      <div className="space-y-2">
        <Label>Room Expiry</Label>
        <div className="flex gap-2">
          {ROOM_EXPIRY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={expiryHours === opt.value ? "default" : "outline"}
              onClick={() => setValue("expiryHours", opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Room"}
      </Button>
    </form>
  );
}

export function CreateRoomForm() {
  const [mode, setMode] = useState<Mode>("select");
  const resetWorkspace = useWorkspaceStore((s) => s.reset);

  useEffect(() => {
    resetWorkspace();
  }, [resetWorkspace]);

  if (mode === "code") {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-4"
            onClick={() => setMode("select")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Create Room</CardTitle>
          <CardDescription>
            Create a shared room for multiple devices to sync in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomCodeForm />
        </CardContent>
      </Card>
    );
  }

  if (mode === "pair") {
    return (
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("select")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <PairSessionView />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <Card
        className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
        onClick={() => setMode("code")}
      >
        <CardHeader className="items-center text-center pb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="mt-2">Buat dengan Kode</CardTitle>
          <CardDescription>
            Buat room dengan kode unik — bagikan ke siapa saja
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" className="w-full">
            Pilih
          </Button>
        </CardContent>
      </Card>

      <Card
        className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
        onClick={() => setMode("pair")}
      >
        <CardHeader className="items-center text-center pb-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <QrCode className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="mt-2">Pair dengan QR</CardTitle>
          <CardDescription>
            Pair dua device secara instan via scan QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" className="w-full">
            Pilih
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
