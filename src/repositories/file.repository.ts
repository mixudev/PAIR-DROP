import type { SupabaseClient } from "@supabase/supabase-js";
import type { SharedFile } from "@/types";

export class FileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByRoom(roomId: string) {
    const { data, error } = await this.supabase
      .from("files")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as SharedFile[];
  }

  async create(file: Partial<SharedFile>) {
    const { data, error } = await this.supabase
      .from("files")
      .insert(file)
      .select()
      .single();
    if (error) throw error;
    return data as SharedFile;
  }

  async delete(id: string) {
    const { error } = await this.supabase.from("files").delete().eq("id", id);
    if (error) throw error;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as SharedFile;
  }
}
