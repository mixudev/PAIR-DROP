import { env } from "@/config/env";
import { ContentRepository } from "@/repositories/content.repository";
import { FileRepository } from "@/repositories/file.repository";
import { PairSessionRepository } from "@/repositories/pair-session.repository";
import { RoomRepository } from "@/repositories/room.repository";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { CreateRoomInput, DeviceInfo } from "@/types";
import { generateRoomCode, sanitizeInput } from "@/lib/utils";

export class RoomService {
  private roomRepo: RoomRepository;
  private contentRepo: ContentRepository;

  constructor() {
    const supabase = createServiceRoleClient();
    this.roomRepo = new RoomRepository(supabase);
    this.contentRepo = new ContentRepository(supabase);
  }

  async createRoom(input: CreateRoomInput, device: DeviceInfo) {
    const code = input.customCode?.toUpperCase() || generateRoomCode();
    const expiresAt =
      input.expiryHours > 0
        ? new Date(Date.now() + input.expiryHours * 3600000).toISOString()
        : null;

    const room = await this.roomRepo.create({
      code,
      name: sanitizeInput(input.name, 100),
      type: input.isPublic ? "public" : "private",
      is_public: input.isPublic,
      expires_at: expiresAt,
    });

    await this.roomRepo.createSettings(room.id);

    const member = await this.roomRepo.addMember({
      room_id: room.id,
      device_id: device.deviceId,
      device_name: sanitizeInput(device.deviceName, 50),
      is_host: true,
    });

    await this.contentRepo.logActivity({
      room_id: room.id,
      action: "room_created",
      metadata: { code: room.code },
      device_id: device.deviceId,
      device_name: device.deviceName,
    });

    return { room, member };
  }

  async joinRoom(code: string, device: DeviceInfo, password?: string) {
    const room = await this.roomRepo.findByCode(code);

    if (room.expires_at && new Date(room.expires_at) < new Date()) {
      throw new Error("This room has expired");
    }

    const existingMembers = await this.roomRepo.getMembers(room.id);
    const existing = existingMembers.find((m) => m.device_id === device.deviceId);
    const hostMember = existingMembers.find((m) => m.is_host);
    const isHostDevice = hostMember?.device_id === device.deviceId;

    const settings = await this.roomRepo.getSettings(room.id);
    const hasPassword = !!(settings?.has_password && settings.room_password);

    if (existing) {
      if (isHostDevice) {
        await this.roomRepo.updateMemberLastSeen(existing.id);
        return { room, member: existing };
      }

      if (hasPassword) {
        const isVerified = existing.password_verified_at
          && new Date(existing.password_verified_at) >= new Date(settings!.password_updated_at);

        if (!isVerified) {
          if (!password || password !== settings!.room_password) {
            throw new Error("Kata sandi room diperlukan");
          }
          await this.roomRepo.updateMemberPasswordVerified(existing.id);
        }
      }

      await this.roomRepo.updateMemberLastSeen(existing.id);
      return { room, member: existing };
    }

    if (!room.is_public && !isHostDevice) {
      throw new Error("Room ini private. Hanya pembuat room yang bisa mengakses.");
    }

    if (hasPassword && !isHostDevice) {
      if (!password || password !== settings!.room_password) {
        throw new Error("Kata sandi room diperlukan");
      }
    }

    const member = await this.roomRepo.addMember({
      room_id: room.id,
      device_id: device.deviceId,
      device_name: sanitizeInput(device.deviceName, 50),
      is_host: false,
    });

    if (hasPassword && password) {
      await this.roomRepo.updateMemberPasswordVerified(member.id);
    }

    await this.contentRepo.logActivity({
      room_id: room.id,
      action: "member_joined",
      metadata: {},
      device_id: device.deviceId,
      device_name: device.deviceName,
    });

    return { room, member };
  }

  async getRoomData(roomId: string, accessToken: string) {
    const member = await this.roomRepo.verifyAccess(roomId, accessToken);
    if (!member) throw new Error("Unauthorized access");

    const room = await this.roomRepo.findById(roomId);
    const members = await this.roomRepo.getMembers(roomId);

    const supabase = createServiceRoleClient();
    const fileRepo = new FileRepository(supabase);
    const contentRepo = new ContentRepository(supabase);

    const [files, messages, clipboardItems, activities] =
      await Promise.all([
        fileRepo.findByRoom(roomId),
        contentRepo.getMessages(roomId),
        contentRepo.getClipboardItems(roomId, env.clipboardHistoryLimit),
        contentRepo.getActivities(roomId),
      ]);

    await this.roomRepo.updateMemberLastSeen(member.id);

    return { room, member, members, files, messages, clipboardItems, activities };
  }
}

export class PairSessionService {
  private pairRepo: PairSessionRepository;
  private roomRepo: RoomRepository;
  private contentRepo: ContentRepository;

  constructor() {
    const supabase = createServiceRoleClient();
    this.pairRepo = new PairSessionRepository(supabase);
    this.roomRepo = new RoomRepository(supabase);
    this.contentRepo = new ContentRepository(supabase);
  }

  async createSession(hostDeviceId: string) {
    await this.pairRepo.expireWaiting();

    const expiresAt = new Date(
      Date.now() + env.pairSessionExpiryMinutes * 60000,
    ).toISOString();

    return this.pairRepo.create({
      host_device_id: hostDeviceId,
      status: "waiting",
      expires_at: expiresAt,
    });
  }

  async joinSession(token: string, guestDevice: DeviceInfo) {
    const session = await this.pairRepo.findByToken(token);

    if (!session) throw new Error("Invalid or expired pairing session");
    if (session.status !== "waiting") throw new Error("This QR code has already been used");
    if (new Date(session.expires_at) < new Date()) {
      await this.pairRepo.update(session.id, { status: "expired" });
      throw new Error("Pairing session has expired");
    }

    const room = await this.roomRepo.create({
      code: generateRoomCode(),
      name: "Pair Session",
      type: "pair",
      is_public: false,
      expires_at: session.expires_at,
    });

    await this.roomRepo.createSettings(room.id);

    const hostMember = await this.roomRepo.addMember({
      room_id: room.id,
      device_id: session.host_device_id,
      device_name: "Host Device",
      is_host: true,
    });

    const guestMember = await this.roomRepo.addMember({
      room_id: room.id,
      device_id: guestDevice.deviceId,
      device_name: sanitizeInput(guestDevice.deviceName, 50),
      is_host: false,
    });

    await this.pairRepo.update(session.id, {
      status: "connected",
      room_id: room.id,
      guest_device_id: guestDevice.deviceId,
      scanned_at: new Date().toISOString(),
    });

    await this.contentRepo.logActivity({
      room_id: room.id,
      action: "room_created",
      metadata: { type: "pair" },
      device_id: guestDevice.deviceId,
      device_name: guestDevice.deviceName,
    });

    return {
      session: { ...session, status: "connected" as const, room_id: room.id },
      room,
      hostMember,
      guestMember,
    };
  }

  async getSessionStatus(sessionId: string) {
    return this.pairRepo.findById(sessionId);
  }
}
