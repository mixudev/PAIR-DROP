import type { SupabaseClient } from "@supabase/supabase-js";
import type { SharedFile, ClipboardItem, Message } from "@/types";

export class MasterRepository {
  constructor(private supabase: SupabaseClient) {}

  async getParticipantFiles(participantRoomId: string) {
    const { data, error } = await this.supabase
      .from("files")
      .select("*")
      .eq("room_id", participantRoomId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as SharedFile[];
  }

  async getParticipantClipboard(participantRoomId: string) {
    const { data, error } = await this.supabase
      .from("clipboard_items")
      .select("*")
      .eq("room_id", participantRoomId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ClipboardItem[];
  }

  async getParticipantMessages(participantRoomId: string) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("room_id", participantRoomId)
      .eq("type", "link")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Message[];
  }
}
