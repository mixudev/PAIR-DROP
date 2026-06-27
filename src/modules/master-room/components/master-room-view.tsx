"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Smartphone, Users, Loader2, RefreshCw, Settings, Clock, FileText, Link2, ClipboardCopy, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layouts/header";
import { ParticipantDetailPanel } from "@/modules/master-room/components/participant-detail-panel";
import { getMasterParticipantsAction, getParticipantContentAction, updateRoomAction, updateRoomPasswordAction } from "@/actions";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import { toast } from "sonner";
import type { Room, RoomMember, MasterRoomParticipant, MasterRoomParticipantWithCounts, SharedFile, ClipboardItem, Message } from "@/types";

interface ParticipantContent {
  files: SharedFile[];
  clipboard: ClipboardItem[];
  links: Message[];
}

interface Props {
  room: Room;
  member: RoomMember;
}

export function MasterRoomView({ room, member }: Props) {
  const [participants, setParticipants] = useState<MasterRoomParticipantWithCounts[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<MasterRoomParticipant | null>(null);
  const [participantContent, setParticipantContent] = useState<ParticipantContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomName, setRoomName] = useState(room.name ?? "");
  const [roomPassword, setRoomPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  const roomUrl = `${env.appUrl}/master/join?roomId=${room.id}&token=${member.access_token}`;

  const fetchParticipants = useCallback(async () => {
    try {
      const result = await getMasterParticipantsAction(room.id, member.access_token);
      if (result.success) {
        setParticipants(result.data ?? []);
      }
    } catch {
      // silent
    } finally {
      setParticipantsLoading(false);
    }
  }, [room.id, member.access_token]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Realtime subscription for new participants
  useEffect(() => {
    const supabase = createClient();

    const sub = supabase
      .channel(`master-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "master_room_participants",
          filter: `master_room_id=eq.${room.id}`,
        },
        () => {
          fetchParticipants();
        },
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [room.id, fetchParticipants]);

  // Poll as fallback for real-time
  useEffect(() => {
    const interval = setInterval(fetchParticipants, 10000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const handleSelectParticipant = async (p: MasterRoomParticipant) => {
    setSelectedParticipant(p);
    setContentLoading(true);
    setParticipantContent(null);
    try {
      const result = await getParticipantContentAction(room.id, p.id, member.access_token);
      if (result.success && result.data) {
        setParticipantContent({
          files: result.data.files,
          clipboard: result.data.clipboard,
          links: result.data.links,
        });
      }
    } finally {
      setContentLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    toast.success("Tautan room disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const nameResult = await updateRoomAction({
        roomId: room.id,
        accessToken: member.access_token,
        name: roomName.trim() || undefined,
      });
      if (!nameResult.success) {
        toast.error(nameResult.error ?? "Gagal menyimpan nama");
        return;
      }
      const passwordResult = await updateRoomPasswordAction({
        roomId: room.id,
        accessToken: member.access_token,
        password: roomPassword.trim() || null,
      });
      if (!passwordResult.success) {
        toast.error(passwordResult.error ?? "Gagal menyimpan kata sandi");
        return;
      }
      toast.success("Pengaturan disimpan");
      setSettingsOpen(false);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showNav={false} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: QR + Info */}
        <div className="flex w-full flex-col items-center justify-center border-r border-border p-6 lg:w-[400px]">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {room.name}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>Scan QR untuk bergabung sebagai participant</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="relative rounded-xl border border-border bg-white p-4">
                <QRCodeSVG value={roomUrl} size={200} level="M" includeMargin fgColor="#171717" />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={() => setQrFullscreen(true)}
                  title="Fullscreen QR"
                >
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <Label>Kode Room</Label>
                  <div className="flex gap-2">
                    <Input value={room.code} readOnly className="font-mono text-lg tracking-wider" />
                    <Button variant="outline" size="icon" onClick={() => {
                      navigator.clipboard.writeText(room.code);
                      toast.success("Kode disalin");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Tautan Room</Label>
                  <div className="flex gap-2">
                    <Input value={roomUrl} readOnly className="text-xs" />
                    <Button variant="outline" size="icon" onClick={handleCopyUrl}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Participant List or Detail Panel */}
        <div className="flex flex-1">
          {/* Participant List */}
          <div className={`flex flex-col border-r border-border transition-all duration-300 ${selectedParticipant ? "w-72" : "flex-1"}`}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Participants ({participants.length})</span>
              </div>
              <Button variant="ghost" size="icon" onClick={fetchParticipants}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {participantsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
                <Smartphone className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Belum ada participant</p>
                <p className="text-xs text-muted-foreground">Scan QR code untuk bergabung</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {(() => {
                    // Group by date
                    const grouped: Record<string, MasterRoomParticipantWithCounts[]> = {};
                    for (const p of participants) {
                      const date = p.last_activity_at
                        ? new Date(p.last_activity_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                        : new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                      if (!grouped[date]) grouped[date] = [];
                      grouped[date].push(p);
                    }
                    return Object.entries(grouped).map(([date, ps]) => (
                      <div key={date} className="mb-3">
                        <p className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{date}</p>
                        <div className="space-y-1">
                          {ps.map((p) => {
                            const activityTime = p.last_activity_at
                              ? new Date(p.last_activity_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                              : null;
                            const hasCounts = p.file_count > 0 || p.link_count > 0 || p.clipboard_count > 0;
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleSelectParticipant(p)}
                                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                                  selectedParticipant?.id === p.id ? "bg-muted font-medium" : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {p.display_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="truncate block">{p.display_name}</span>
                                    {activityTime && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {activityTime}
                                      </span>
                                    )}
                                  </div>
                                  {hasCounts && (
                                    <div className="flex shrink-0 flex-wrap gap-1">
                                      {p.file_count > 0 && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                          <FileText className="h-3 w-3" />
                                          {p.file_count}
                                        </span>
                                      )}
                                      {p.link_count > 0 && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                                          <Link2 className="h-3 w-3" />
                                          {p.link_count}
                                        </span>
                                      )}
                                      {p.clipboard_count > 0 && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                                          <ClipboardCopy className="h-3 w-3" />
                                          {p.clipboard_count}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Detail Panel */}
          {selectedParticipant && (
            <div className="flex-1">
              <ParticipantDetailPanel
                participant={selectedParticipant}
                content={participantContent}
                loading={contentLoading}
                onClose={() => {
                  setSelectedParticipant(null);
                  setParticipantContent(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* QR Fullscreen Dialog */}
      <Dialog open={qrFullscreen} onOpenChange={setQrFullscreen}>
        <DialogContent className="flex flex-col items-center sm:max-w-md">
          <DialogHeader className="w-full">
            <DialogTitle>Scan QR untuk Bergabung</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-xl border border-border bg-white p-6">
              <QRCodeSVG value={roomUrl} size={280} level="M" includeMargin fgColor="#171717" />
            </div>
            <p className="text-sm text-muted-foreground">
              Scan QR code ini untuk bergabung sebagai participant
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pengaturan Room Master</DialogTitle>
            <DialogDescription>Ubah nama room dan kata sandi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="master-room-name">Nama Room</Label>
              <Input
                id="master-room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Nama room"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="master-room-password">Kata Sandi (kosongkan untuk menghapus)</Label>
              <Input
                id="master-room-password"
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Kata sandi baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Batal</Button>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
