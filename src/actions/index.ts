"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { env, maxFileSizeBytes } from "@/config/env";
import { ContentRepository } from "@/repositories/content.repository";
import { FileRepository } from "@/repositories/file.repository";
import { RoomRepository } from "@/repositories/room.repository";
import { PairSessionService, RoomService } from "@/services/room.service";
import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeInput } from "@/lib/utils";

async function linkRoomToUser(roomId: string, memberId: string, accessToken: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const service = createServiceRoleClient();
    await service.from("rooms").update({ user_id: user.id }).eq("id", roomId);
    await service.from("room_members").update({ user_id: user.id }).eq("id", memberId);
    await service.from("user_room_tokens").upsert(
      {
        user_id: user.id,
        room_id: roomId,
        member_id: memberId,
        access_token: accessToken,
      },
      { onConflict: "user_id,room_id" },
    );
  } catch (e) {
    console.error("[linkRoomToUser] Failed:", e);
  }
}

const deviceSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(50),
});

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean(),
  expiryHours: z.number().min(0).max(8760),
  customCode: z.string().optional(),
  device: deviceSchema,
});

const joinRoomSchema = z.object({
  code: z.string().min(4).max(20),
  device: deviceSchema,
});

export async function createRoomAction(input: z.infer<typeof createRoomSchema>) {
  try {
    const parsed = createRoomSchema.parse(input);
    const service = new RoomService();
    const result = await service.createRoom(
      {
        name: parsed.name,
        isPublic: parsed.isPublic,
        expiryHours: parsed.expiryHours,
        customCode: parsed.customCode,
      },
      parsed.device,
    );

    await linkRoomToUser(result.room.id, result.member.id, result.member.access_token);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create room",
    };
  }
}

export async function joinRoomAction(input: z.infer<typeof joinRoomSchema>) {
  try {
    const parsed = joinRoomSchema.parse(input);
    const service = new RoomService();
    const result = await service.joinRoom(parsed.code, parsed.device);

    await linkRoomToUser(result.room.id, result.member.id, result.member.access_token);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join room",
    };
  }
}

export async function getRoomDataAction(roomId: string, accessToken: string) {
  try {
    const service = new RoomService();
    const data = await service.getRoomData(roomId, accessToken);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load room",
    };
  }
}

export async function createPairSessionAction(hostDeviceId: string) {
  try {
    z.string().uuid().parse(hostDeviceId);
    const service = new PairSessionService();
    const session = await service.createSession(hostDeviceId);
    return { success: true, data: session };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create session",
    };
  }
}

export async function joinPairSessionAction(
  token: string,
  device: z.infer<typeof deviceSchema>,
) {
  try {
    z.string().min(10).parse(token);
    const parsedDevice = deviceSchema.parse(device);
    const service = new PairSessionService();
    const result = await service.joinSession(token, parsedDevice);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to join session",
    };
  }
}

export async function getPairSessionStatusAction(sessionId: string) {
  try {
    const service = new PairSessionService();
    const session = await service.getSessionStatus(sessionId);
    return { success: true, data: session };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get session",
    };
  }
}

export async function sendClipboardAction(input: {
  roomId: string;
  accessToken: string;
  content: string;
  deviceId: string;
  deviceName: string;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);
    const contentRepo = new ContentRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member) throw new Error("Unauthorized");

    const item = await contentRepo.createClipboardItem({
      room_id: input.roomId,
      content: sanitizeInput(input.content, 50000),
      sender_device_id: input.deviceId,
      sender_name: sanitizeInput(input.deviceName, 50),
    });

    await contentRepo.trimClipboardHistory(
      input.roomId,
      env.clipboardHistoryLimit,
    );

    await contentRepo.logActivity({
      room_id: input.roomId,
      action: "clipboard_sent",
      metadata: { preview: input.content.slice(0, 50) },
      device_id: input.deviceId,
      device_name: input.deviceName,
    });

    revalidatePath(`/workspace/${input.roomId}`);
    return { success: true, data: item };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send clipboard",
    };
  }
}

export async function shareLinkAction(input: {
  roomId: string;
  accessToken: string;
  url: string;
  deviceId: string;
  deviceName: string;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);
    const contentRepo = new ContentRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member) throw new Error("Unauthorized");

    const url = sanitizeInput(input.url, 2000);
    if (!/^https?:\/\/.+/.test(url)) throw new Error("Invalid URL");

    const message = await contentRepo.createMessage({
      room_id: input.roomId,
      type: "link",
      content: url,
      sender_device_id: input.deviceId,
      sender_name: sanitizeInput(input.deviceName, 50),
    });

    await contentRepo.logActivity({
      room_id: input.roomId,
      action: "link_shared",
      metadata: { url },
      device_id: input.deviceId,
      device_name: input.deviceName,
    });

    return { success: true, data: message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to share link",
    };
  }
}

export async function deleteFileAction(input: {
  roomId: string;
  accessToken: string;
  fileId: string;
  deviceId: string;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);
    const fileRepo = new FileRepository(supabase);
    const contentRepo = new ContentRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member) throw new Error("Unauthorized");

    const file = await fileRepo.findById(input.fileId);
    if (!file) throw new Error("File not found");

    if (file.uploaded_by_device_id !== input.deviceId && !member.is_host) {
      throw new Error("You don't have permission to delete this file");
    }

    await supabase.storage.from(env.storageBucket).remove([file.storage_path]);
    await fileRepo.delete(input.fileId);

    await contentRepo.logActivity({
      room_id: input.roomId,
      action: "file_deleted",
      metadata: { fileName: file.file_name },
      device_id: input.deviceId,
      device_name: member.device_name,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

export async function registerFileAction(input: {
  roomId: string;
  accessToken: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  deviceId: string;
  deviceName: string;
}) {
  try {
    if (input.fileSize > maxFileSizeBytes) {
      throw new Error(`File exceeds maximum size of ${env.maxFileSizeMb}MB`);
    }

    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);
    const fileRepo = new FileRepository(supabase);
    const contentRepo = new ContentRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member) throw new Error("Unauthorized");

    const file = await fileRepo.create({
      room_id: input.roomId,
      storage_path: input.storagePath,
      file_name: sanitizeInput(input.fileName, 255),
      file_size: input.fileSize,
      mime_type: input.mimeType,
      uploaded_by_device_id: input.deviceId,
      uploaded_by_name: sanitizeInput(input.deviceName, 50),
    });

    await contentRepo.logActivity({
      room_id: input.roomId,
      action: "file_uploaded",
      metadata: { fileName: file.file_name, size: file.file_size },
      device_id: input.deviceId,
      device_name: input.deviceName,
    });

    return { success: true, data: file };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to register file",
    };
  }
}

export async function getUploadUrlAction(input: {
  roomId: string;
  accessToken: string;
  fileName: string;
  deviceId: string;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member) throw new Error("Unauthorized");

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${input.roomId}/${input.deviceId}/${Date.now()}-${safeName}`;

    return { success: true, data: { storagePath } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get upload path",
    };
  }
}

export async function getMemberByDeviceAction(
  roomId: string,
  deviceId: string,
) {
  try {
    z.string().uuid().parse(roomId);
    z.string().uuid().parse(deviceId);
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_id", roomId)
      .eq("device_id", deviceId)
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Member not found",
    };
  }
}

export async function getFileUrlAction(storagePath: string) {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.storage
      .from(env.storageBucket)
      .createSignedUrl(storagePath, 3600);
    return { success: true, data: data?.signedUrl ?? null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get file URL",
    };
  }
}

export async function updateRoomAction(input: {
  roomId: string;
  accessToken: string;
  isPublic?: boolean;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member || !member.is_host) throw new Error("Only the host can update room settings");

    const updates: Record<string, unknown> = {};
    if (input.isPublic !== undefined) {
      updates.is_public = input.isPublic;
      updates.type = input.isPublic ? "public" : "private";
    }

    await roomRepo.update(input.roomId, updates);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update room",
    };
  }
}

export async function updateRoomPasswordAction(input: {
  roomId: string;
  accessToken: string;
  password: string | null;
}) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);

    const member = await roomRepo.verifyAccess(input.roomId, input.accessToken);
    if (!member || !member.is_host) throw new Error("Only the host can change room password");

    const settings = await roomRepo.getSettings(input.roomId);
    if (!settings) throw new Error("Room settings not found");

    if (input.password) {
      await roomRepo.updateSettings(input.roomId, {
        has_password: true,
        room_password: input.password,
      });
    } else {
      await roomRepo.updateSettings(input.roomId, {
        has_password: false,
        room_password: null,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

export async function getRoomSettingsAction(roomId: string, accessToken: string) {
  try {
    const supabase = createServiceRoleClient();
    const roomRepo = new RoomRepository(supabase);

    const member = await roomRepo.verifyAccess(roomId, accessToken);
    if (!member) throw new Error("Unauthorized access");

    const settings = await roomRepo.getSettings(roomId);
    return { success: true, data: settings };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load settings",
    };
  }
}
