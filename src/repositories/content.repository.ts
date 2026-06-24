import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLog, ClipboardItem, Message, Note } from "@/types";

export class ContentRepository {
  constructor(private supabase: SupabaseClient) {}

  async getMessages(roomId: string) {
    const { data, error } = await this.supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Message[];
  }

  async createMessage(message: Partial<Message>) {
    const { data, error } = await this.supabase
      .from("messages")
      .insert(message)
      .select()
      .single();
    if (error) throw error;
    return data as Message;
  }

  async getClipboardItems(roomId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("clipboard_items")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ClipboardItem[];
  }

  async createClipboardItem(item: Partial<ClipboardItem>) {
    const { data, error } = await this.supabase
      .from("clipboard_items")
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data as ClipboardItem;
  }

  async trimClipboardHistory(roomId: string, limit: number) {
    const items = await this.getClipboardItems(roomId, limit + 10);
    if (items.length > limit) {
      const toDelete = items.slice(limit);
      for (const item of toDelete) {
        await this.supabase.from("clipboard_items").delete().eq("id", item.id);
      }
    }
  }

  async getNotes(roomId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("*")
      .eq("room_id", roomId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data as Note[];
  }

  async createNote(note: Partial<Note>) {
    const { data, error } = await this.supabase
      .from("notes")
      .insert(note)
      .select()
      .single();
    if (error) throw error;
    return data as Note;
  }

  async updateNote(id: string, updates: Partial<Note>) {
    const { data, error } = await this.supabase
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Note;
  }

  async getActivities(roomId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as ActivityLog[];
  }

  async logActivity(activity: Partial<ActivityLog>) {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .insert(activity)
      .select()
      .single();
    if (error) throw error;
    return data as ActivityLog;
  }
}
