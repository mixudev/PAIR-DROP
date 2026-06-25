import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room, RoomMember, RoomSettings } from "@/types";

export class RoomRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Room;
  }

  async findByCode(code: string) {
    const { data, error } = await this.supabase
      .from("rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();
    if (error) throw error;
    return data as Room;
  }

  async create(room: Partial<Room>) {
    const { data, error } = await this.supabase
      .from("rooms")
      .insert(room)
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  }

  async update(id: string, updates: Partial<Room>) {
    const { data, error } = await this.supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Room;
  }

  async getMembers(roomId: string) {
    const { data, error } = await this.supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    if (error) throw error;
    return data as RoomMember[];
  }

  async addMember(member: Partial<RoomMember>) {
    const { data, error } = await this.supabase
      .from("room_members")
      .insert(member)
      .select()
      .single();
    if (error) throw error;
    return data as RoomMember;
  }

  async updateMemberLastSeen(memberId: string) {
    await this.supabase
      .from("room_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", memberId);
  }

  async verifyAccess(roomId: string, accessToken: string) {
    const { data, error } = await this.supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("access_token", accessToken)
      .single();
    if (error) return null;
    return data as RoomMember;
  }

  async createSettings(roomId: string) {
    const { error } = await this.supabase
      .from("room_settings")
      .insert({ room_id: roomId });
    if (error) throw error;
  }

  async getSettings(roomId: string) {
    const { data, error } = await this.supabase
      .from("room_settings")
      .select("*")
      .eq("room_id", roomId)
      .single();
    if (error) return null;
    return data as RoomSettings;
  }

  async updateSettings(roomId: string, updates: Partial<RoomSettings>) {
    const { data, error } = await this.supabase
      .from("room_settings")
      .update(updates)
      .eq("room_id", roomId)
      .select()
      .single();
    if (error) throw error;
    return data as RoomSettings;
  }
}
