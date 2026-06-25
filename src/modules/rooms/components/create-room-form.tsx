"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createRoomAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MEMBER_TOKEN_STORAGE_KEY, getRoomTokenKey, ROOM_EXPIRY_OPTIONS } from "@/constants";
import { useDeviceStore, useWorkspaceStore } from "@/stores";

const schema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  isPublic: z.boolean(),
  expiryHours: z.number(),
  customCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateRoomForm() {
  const router = useRouter();
  const { deviceId, deviceName } = useDeviceStore();
  const resetWorkspace = useWorkspaceStore((s) => s.reset);

  useEffect(() => {
    resetWorkspace();
  }, [resetWorkspace]);
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
      // Store token per-room (fix for private room access bug)
      localStorage.setItem(getRoomTokenKey(roomId), token);
      // Also keep legacy key for backward compat
      localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token);
      toast.success(`Room ${result.data.room.code} created!`);
      router.push(`/workspace/${roomId}`);
    } else {
      toast.error(result.error ?? "Failed to create room");
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Create Room</CardTitle>
        <CardDescription>
          Create a shared room for multiple devices to sync in real-time
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
