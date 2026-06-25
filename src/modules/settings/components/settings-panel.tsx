"use client";

import { Copy, Check, Globe, Shield, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import { env } from "@/config/env";
import { updateRoomAction, updateRoomPasswordAction, getRoomSettingsAction } from "@/actions";

export function SettingsPanel() {
  const { room, member, memberToken } = useWorkspaceStore();
  const { deviceName, setDeviceName } = useDeviceStore();
  const [copied, setCopied] = useState(false);
  const [localName, setLocalName] = useState(deviceName);
  const [isPublic, setIsPublic] = useState(room?.is_public ?? false);
  const [hasPassword, setHasPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [saving, setSaving] = useState(false);

  const roomUrl = room
    ? `${env.appUrl}/room/join?code=${room.code}`
    : "";

  useEffect(() => {
    if (!room || !memberToken) return;
    setIsPublic(room.is_public);
    getRoomSettingsAction(room.id, memberToken).then((res) => {
      if (res.success && res.data) {
        setHasPassword(res.data.has_password);
      }
    });
  }, [room, memberToken]);

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

  const handleTogglePublic = async () => {
    if (!room || !memberToken || !member?.is_host) {
      toast.error("Only the host can change room settings");
      return;
    }
    setSaving(true);
    try {
      const res = await updateRoomAction({
        roomId: room.id,
        accessToken: memberToken,
        isPublic: !isPublic,
      });
      if (res.success) {
        setIsPublic(!isPublic);
        toast.success(isPublic ? "Room changed to private" : "Room changed to public");
      } else {
        toast.error(res.error ?? "Failed to update room");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!room || !memberToken || !member?.is_host) {
      toast.error("Only the host can change room password");
      return;
    }
    setSaving(true);
    try {
      const password = roomPassword.trim() || null;
      const res = await updateRoomPasswordAction({
        roomId: room.id,
        accessToken: memberToken,
        password,
      });
      if (res.success) {
        setHasPassword(!!password);
        setShowPasswordField(false);
        setRoomPassword("");
        toast.success(password ? "Room password set" : "Room password removed");
      } else {
        toast.error(res.error ?? "Failed to update password");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Info</CardTitle>
          <CardDescription>Share this room with others</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-md border border-border bg-white p-3">
              <QRCodeSVG
                value={roomUrl}
                size={160}
                level="M"
                includeMargin
                fgColor="#171717"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Scan to join this room
            </p>
          </div>
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

      {member?.is_host && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Room Settings</CardTitle>
            <CardDescription>Manage room access and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Shield className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label>Room Type</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic
                      ? "Anyone with the code can join"
                      : "Only you can access this room"}
                  </p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} disabled={saving} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasPassword ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label>Room Password</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                >
                  {showPasswordField ? "Cancel" : hasPassword ? "Change" : "Set"}
                </Button>
              </div>
              {showPasswordField && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={hasPassword ? "Enter new password" : "Set room password"}
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                  />
                  <Button size="sm" onClick={handleSavePassword} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
              {hasPassword && !showPasswordField && (
                <p className="text-xs text-muted-foreground">
                  This room is password protected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
