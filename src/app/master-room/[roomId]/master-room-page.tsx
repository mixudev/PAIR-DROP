"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layouts/header";
import { MasterRoomView } from "@/modules/master-room/components/master-room-view";
import { getRoomDataAction } from "@/actions";
import { MEMBER_TOKEN_STORAGE_KEY, getRoomTokenKey } from "@/constants";
import type { Room, RoomMember } from "@/types";

export function MasterRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [member, setMember] = useState<RoomMember | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem(getRoomTokenKey(roomId))
        ?? localStorage.getItem(MEMBER_TOKEN_STORAGE_KEY);

      if (!token) {
        setError("Access token not found");
        setLoading(false);
        return;
      }

      const result = await getRoomDataAction(roomId, token);
      if (result.success && result.data) {
        if (result.data.room.type !== "master") {
          setError("This is not a master room");
          setLoading(false);
          return;
        }
        if (!result.data.member.is_host) {
          setError("Only the room master can access this page");
          setLoading(false);
          return;
        }
        setRoom(result.data.room);
        setMember(result.data.member);
      } else {
        setError(result.error ?? "Failed to load room");
      }
      setLoading(false);
    }

    load();
  }, [roomId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !room || !member) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-destructive">{error ?? "Failed to load master room"}</p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <MasterRoomView room={room} member={member} />;
}
