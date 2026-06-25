"use client";

import { useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Smartphone, Users, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layouts/header";
import { ParticipantDetailPanel } from "@/modules/master-room/components/participant-detail-panel";
import { getMasterParticipantsAction, getParticipantContentAction } from "@/actions";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import { toast } from "sonner";
import type { Room, RoomMember, MasterRoomParticipant, SharedFile, ClipboardItem, Message } from "@/types";

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
  const [participants, setParticipants] = useState<MasterRoomParticipant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<MasterRoomParticipant | null>(null);
  const [participantContent, setParticipantContent] = useState<ParticipantContent | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      const result = await getParticipantContentAction(room.id, p.device_id, member.access_token);
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showNav={false} />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: QR + Info */}
        <div className="flex w-full flex-col items-center justify-center border-r border-border p-6 lg:w-[400px]">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle>{room.name}</CardTitle>
              <CardDescription>Scan QR untuk bergabung sebagai participant</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-border bg-white p-4">
                <QRCodeSVG value={roomUrl} size={200} level="M" includeMargin fgColor="#171717" />
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
                <div className="p-2 space-y-1">
                  {participants.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectParticipant(p)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                        selectedParticipant?.id === p.id ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {p.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{p.display_name}</span>
                      </div>
                    </button>
                  ))}
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
    </div>
  );
}
