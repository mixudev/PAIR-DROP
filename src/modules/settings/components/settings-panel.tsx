"use client";

import { Copy, Check, Globe, Shield, Lock, Unlock, QrCode, Smartphone } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import { env } from "@/config/env";
import { updateRoomAction, updateRoomPasswordAction, getRoomSettingsAction } from "@/actions";

export function SettingsPanel() {
  const { room, member, memberToken } = useWorkspaceStore();
  const { deviceName, setDeviceName } = useDeviceStore();
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [localName, setLocalName] = useState(deviceName);
  const [isPublic, setIsPublic] = useState(room?.is_public ?? false);
  const [hasPassword, setHasPassword] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("info");

  const roomUrl = room && memberToken
    ? `${env.appUrl}/workspace/${room.id}?token=${memberToken}`
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
    toast.success("Kode room disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(roomUrl);
    setCopiedUrl(true);
    toast.success("Tautan room disalin");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveName = () => {
    setDeviceName(localName);
    toast.success("Nama perangkat diperbarui");
  };

  const handleTogglePublic = async () => {
    if (!room || !memberToken || !member?.is_host) {
      toast.error("Hanya host yang dapat mengubah pengaturan room");
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
        toast.success(isPublic ? "Room diubah ke private" : "Room diubah ke publik");
      } else {
        toast.error(res.error ?? "Gagal memperbarui room");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!room || !memberToken || !member?.is_host) {
      toast.error("Hanya host yang dapat mengubah kata sandi room");
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
        toast.success(password ? "Kata sandi room ditetapkan" : "Kata sandi room dihapus");
      } else {
        toast.error(res.error ?? "Gagal memperbarui kata sandi");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="info" className="flex-1 gap-2">
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">Info Room</span>
          </TabsTrigger>
          {member?.is_host && (
            <TabsTrigger value="access" className="flex-1 gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Akses</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="device" className="flex-1 gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Perangkat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bagikan Room</CardTitle>
              <CardDescription>Scan QR atau bagikan kode untuk bergabung</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl border border-border bg-white p-4">
                    <QRCodeSVG
                      value={roomUrl}
                      size={160}
                      level="M"
                      includeMargin
                      fgColor="#171717"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan untuk langsung menuju room
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label>Kode Room</Label>
                    <div className="flex gap-2">
                      <Input
                        value={room?.code ?? ""}
                        readOnly
                        className="font-mono text-lg tracking-wider"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopyCode}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tautan Room</Label>
                    <div className="flex gap-2">
                      <Input value={roomUrl} readOnly className="text-xs" />
                      <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                        {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {room?.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Berakhir: {new Date(room.expires_at).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {member?.is_host && (
          <TabsContent value="access" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pengaturan Akses</CardTitle>
                <CardDescription>Atur siapa yang dapat bergabung ke room ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                      {isPublic ? (
                        <Globe className="h-5 w-5 text-primary" />
                      ) : (
                        <Shield className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Room Publik</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isPublic
                          ? "Siapa pun dengan kode dapat bergabung"
                          : "Hanya host yang dapat mengakses room ini"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={isPublic} onCheckedChange={handleTogglePublic} disabled={saving} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        {hasPassword ? (
                          <Lock className="h-5 w-5 text-primary" />
                        ) : (
                          <Unlock className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Kata Sandi Room</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {hasPassword
                            ? "Room dilindungi kata sandi"
                            : "Tidak ada kata sandi"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordField(!showPasswordField)}
                    >
                      {showPasswordField ? "Batal" : hasPassword ? "Ubah" : "Atur"}
                    </Button>
                  </div>
                  {showPasswordField && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        type="text"
                        placeholder={hasPassword ? "Masukkan kata sandi baru" : "Atur kata sandi room"}
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                      />
                      <Button size="sm" onClick={handleSavePassword} disabled={saving}>
                        {saving ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="device" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Perangkat Saya</CardTitle>
              <CardDescription>Sesuaikan tampilan perangkat Anda di room ini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Nama Perangkat</Label>
                <Input
                  id="deviceName"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveName} size="sm">
                Simpan Nama
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
