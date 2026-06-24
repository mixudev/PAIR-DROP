export type RoomType = "pair" | "public" | "private";
export type PairSessionStatus = "waiting" | "connected" | "expired";
export type MessageType = "text" | "link" | "system";
export type ActivityAction =
  | "room_created"
  | "member_joined"
  | "member_left"
  | "file_uploaded"
  | "file_deleted"
  | "clipboard_sent"
  | "note_updated"
  | "link_shared";

export interface User {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  slug: string | null;
  type: RoomType;
  is_public: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  device_id: string;
  device_name: string;
  access_token: string;
  is_host: boolean;
  last_seen_at: string;
  joined_at: string;
}

export interface PairSession {
  id: string;
  token: string;
  room_id: string | null;
  status: PairSessionStatus;
  host_device_id: string;
  guest_device_id: string | null;
  expires_at: string;
  scanned_at: string | null;
  created_at: string;
}

export interface SharedFile {
  id: string;
  room_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by_device_id: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  type: MessageType;
  content: string;
  sender_device_id: string;
  sender_name: string;
  created_at: string;
}

export interface ClipboardItem {
  id: string;
  room_id: string;
  content: string;
  sender_device_id: string;
  sender_name: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  room_id: string;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  device_id: string;
  device_name: string;
  created_at: string;
}

export interface RoomSettings {
  id: string;
  room_id: string;
  max_file_size_mb: number;
  clipboard_history_limit: number;
  allow_file_upload: boolean;
  allow_guest_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
}

export interface JoinRoomResult {
  room: Room;
  member: RoomMember;
}

export interface CreateRoomInput {
  name: string;
  isPublic: boolean;
  expiryHours: number;
  customCode?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "complete" | "error";
}
