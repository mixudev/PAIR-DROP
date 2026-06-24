"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspaceStore } from "@/stores";
import type {
  ActivityLog,
  ClipboardItem,
  Message,
  Note,
  RoomMember,
  SharedFile,
} from "@/types";

export function useRoomRealtime(roomId: string | null) {
  const {
    addFile,
    removeFile,
    addMessage,
    addClipboardItem,
    updateNote,
    addNote,
    addActivity,
    setMembers,
    setConnectionStatus,
  } = useWorkspaceStore();

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    setConnectionStatus("connected");

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "files", filter: `room_id=eq.${roomId}` },
        (payload) => addFile(payload.new as SharedFile),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "files", filter: `room_id=eq.${roomId}` },
        (payload) => removeFile((payload.old as SharedFile).id),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        (payload) => addMessage(payload.new as Message),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clipboard_items", filter: `room_id=eq.${roomId}` },
        (payload) => addClipboardItem(payload.new as ClipboardItem),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes", filter: `room_id=eq.${roomId}` },
        (payload) => addNote(payload.new as Note),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notes", filter: `room_id=eq.${roomId}` },
        (payload) => updateNote(payload.new as Note),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs", filter: `room_id=eq.${roomId}` },
        (payload) => addActivity(payload.new as ActivityLog),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        async () => {
          const { data } = await supabase
            .from("room_members")
            .select("*")
            .eq("room_id", roomId)
            .order("joined_at", { ascending: true });
          if (data) setMembers(data as RoomMember[]);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("connected");
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnectionStatus("disconnected");
    };
  }, [
    roomId,
    addFile,
    removeFile,
    addMessage,
    addClipboardItem,
    updateNote,
    addNote,
    addActivity,
    setMembers,
    setConnectionStatus,
  ]);
}

export function usePairSessionRealtime(
  sessionId: string | null,
  onConnected: (roomId: string) => void,
) {
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`pair:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pair_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const session = payload.new as { status: string; room_id: string | null };
          if (session.status === "connected" && session.room_id) {
            onConnected(session.room_id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onConnected]);
}

export function useHeartbeat(roomId: string | null, memberId: string | null) {
  const updateLastSeen = useCallback(async () => {
    if (!roomId || !memberId) return;
    const supabase = createClient();
    await supabase
      .from("room_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", memberId);
  }, [roomId, memberId]);

  useEffect(() => {
    if (!roomId || !memberId) return;
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [roomId, memberId, updateLastSeen]);
}
