import type { SupabaseClient } from "@supabase/supabase-js";
import type { PairSession } from "@/types";

export class PairSessionRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(session: Partial<PairSession>) {
    const { data, error } = await this.supabase
      .from("pair_sessions")
      .insert(session)
      .select()
      .single();
    if (error) throw error;
    return data as PairSession;
  }

  async findByToken(token: string) {
    const { data, error } = await this.supabase
      .from("pair_sessions")
      .select("*")
      .eq("token", token)
      .single();
    if (error) return null;
    return data as PairSession;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from("pair_sessions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as PairSession;
  }

  async update(id: string, updates: Partial<PairSession>) {
    const { data, error } = await this.supabase
      .from("pair_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as PairSession;
  }

  async expireWaiting() {
    await this.supabase
      .from("pair_sessions")
      .update({ status: "expired" })
      .eq("status", "waiting")
      .lt("expires_at", new Date().toISOString());
  }
}
