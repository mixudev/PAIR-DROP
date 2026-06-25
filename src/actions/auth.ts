"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getCurrentUserAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { success: true, data: null };
    return { success: true, data: data.user };
  } catch {
    return { success: false, data: null };
  }
}

/**
 * Link a room to the authenticated user account.
 * Called after room creation/join when user is logged in.
 */
export async function linkRoomToUserAction(input: {
  roomId: string;
  memberId: string;
  accessToken: string;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const service = createServiceRoleClient();

    // Update room's user_id
    await service.from("rooms").update({ user_id: user.id }).eq("id", input.roomId);

    // Update room_member's user_id
    await service.from("room_members").update({ user_id: user.id }).eq("id", input.memberId);

    // Upsert user_room_tokens for recovery
    await service.from("user_room_tokens").upsert(
      {
        user_id: user.id,
        room_id: input.roomId,
        member_id: input.memberId,
        access_token: input.accessToken,
      },
      { onConflict: "user_id,room_id" },
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link room",
    };
  }
}

/**
 * Recover a room access token for the current authenticated user.
 * Use this when localStorage token is missing but user is logged in.
 */
export async function recoverRoomAccessAction(roomId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const service = createServiceRoleClient();
    const { data, error } = await service
      .from("user_room_tokens")
      .select("access_token, member_id")
      .eq("user_id", user.id)
      .eq("room_id", roomId)
      .single();

    if (error || !data) return { success: false, data: null };
    return { success: true, data };
  } catch {
    return { success: false, data: null };
  }
}

/**
 * Get all rooms belonging to the authenticated user (for dashboard).
 */
export async function getUserRoomsAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [], error: "Not authenticated" };

    const service = createServiceRoleClient();
    const { data, error } = await service
      .from("rooms")
      .select(`
        id, code, name, type, is_public, expires_at, created_at, updated_at,
        room_members(count),
        files(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load rooms",
    };
  }
}

/**
 * Delete a room (only room owner can do this).
 */
export async function deleteRoomAction(roomId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const service = createServiceRoleClient();

    // Verify ownership
    const { data: room } = await service
      .from("rooms")
      .select("user_id")
      .eq("id", roomId)
      .single();

    if (!room || room.user_id !== user.id) {
      return { success: false, error: "You don't own this room" };
    }

    await service.from("rooms").delete().eq("id", roomId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete room",
    };
  }
}

/**
 * Get user room token for recovery (returns the access_token for a specific room).
 */
export async function getUserRoomTokenAction(roomId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null };

    const service = createServiceRoleClient();
    const { data } = await service
      .from("user_room_tokens")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("room_id", roomId)
      .single();

    return { success: true, data: data?.access_token ?? null };
  } catch {
    return { success: false, data: null };
  }
}
