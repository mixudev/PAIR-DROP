"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import { env } from "@/config/env";

export function SettingsPanel() {
  const { room } = useWorkspaceStore();
  const { deviceName, setDeviceName } = useDeviceStore();
  const [copied, setCopied] = useState(false);
  const [localName, setLocalName] = useState(deviceName);

  const roomUrl = room
    ? `${env.appUrl}/room/join?code=${room.code}`
    : "";

  const handleCopyCode = async () => {
    if (!room) return;
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    toast.success("Room code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(roomUrl);
    toast.success("Room URL copied");
  };

  const handleSaveName = () => {
    setDeviceName(localName);
    toast.success("Device name updated");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Info</CardTitle>
          <CardDescription>Share this room with others</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Room Code</Label>
            <div className="flex gap-2">
              <Input
                value={room?.code ?? ""}
                readOnly
                className="font-mono text-lg tracking-wider"
              />
              <Button variant="outline" size="icon" onClick={handleCopyCode}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Join URL</Label>
            <div className="flex gap-2">
              <Input value={roomUrl} readOnly className="text-xs" />
              <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {room?.expires_at && (
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(room.expires_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Device Settings</CardTitle>
          <CardDescription>Customize how you appear in this room</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deviceName">Device Name</Label>
            <Input
              id="deviceName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveName} size="sm">
            Save Device Name
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
