export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "pairdrop-files",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "PairDrop",
  pairSessionExpiryMinutes: Number(
    process.env.PAIR_SESSION_EXPIRY_MINUTES ?? "30",
  ),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB ?? "50"),
  allowedFileTypes: (
    process.env.ALLOWED_FILE_TYPES ??
    "image/*,application/pdf,application/zip,video/*,audio/*,text/*"
  ).split(","),
  defaultRoomExpiryHours: Number(process.env.DEFAULT_ROOM_EXPIRY_HOURS ?? "24"),
  clipboardHistoryLimit: Number(process.env.CLIPBOARD_HISTORY_LIMIT ?? "50"),
} as const;

export const maxFileSizeBytes = env.maxFileSizeMb * 1024 * 1024;

export function assertSupabaseConfigured() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export function assertServiceRoleConfigured() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }
}
