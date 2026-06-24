export const APP_NAME = "PairDrop";
export const APP_DESCRIPTION =
  "Real-time file, link, text, and clipboard sync across all your devices.";

export const ROOM_CODE_PREFIX = "PAIR";
export const ROOM_CODE_LENGTH = 4;

export const CONNECTION_STATUS = {
  CONNECTED: "connected",
  WAITING: "waiting",
  DISCONNECTED: "disconnected",
} as const;

export type ConnectionStatus =
  (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export const ROOM_EXPIRY_OPTIONS = [
  { label: "1 Hour", value: 1 },
  { label: "24 Hours", value: 24 },
  { label: "Never", value: 0 },
] as const;

export const WORKSPACE_SECTIONS = [
  { id: "files", label: "Files", icon: "Files" },
  { id: "links", label: "Links", icon: "Link" },
  { id: "clipboard", label: "Clipboard", icon: "Clipboard" },
  { id: "members", label: "Members", icon: "Users" },
  { id: "settings", label: "Settings", icon: "Settings" },
] as const;

export type WorkspaceSectionId =
  (typeof WORKSPACE_SECTIONS)[number]["id"];

export const DEVICE_STORAGE_KEY = "pairdrop_device_id";
export const MEMBER_TOKEN_STORAGE_KEY = "pairdrop_member_token";
