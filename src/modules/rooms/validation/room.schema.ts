import { z } from "zod";

export const deviceSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(50),
});

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean(),
  expiryHours: z.number().min(0).max(8760),
  customCode: z.string().optional(),
  device: deviceSchema,
});

export const joinRoomSchema = z.object({
  code: z.string().min(4).max(20),
  device: deviceSchema,
});

export const clipboardSchema = z.object({
  roomId: z.string().uuid(),
  accessToken: z.string().min(10),
  content: z.string().min(1).max(50000),
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(50),
});

export const linkSchema = z.object({
  roomId: z.string().uuid(),
  accessToken: z.string().min(10),
  url: z.string().url().max(2000),
  deviceId: z.string().uuid(),
  deviceName: z.string().min(1).max(50),
});

export const noteSchema = z.object({
  roomId: z.string().uuid(),
  accessToken: z.string().min(10),
  noteId: z.string().uuid().optional(),
  title: z.string().max(200),
  content: z.string().max(100000),
  deviceId: z.string().uuid(),
});
