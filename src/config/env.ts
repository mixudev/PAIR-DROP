function getEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  storageBucket: getEnv("NEXT_PUBLIC_STORAGE_BUCKET", "lazshare-files"),
  appUrl: getEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  appName: getEnv("NEXT_PUBLIC_APP_NAME", "LazShare"),
  pairSessionExpiryMinutes: Number(
    getEnv("PAIR_SESSION_EXPIRY_MINUTES", "30"),
  ),
  maxFileSizeMb: Number(getEnv("MAX_FILE_SIZE_MB", "50")),
  allowedFileTypes: (
    getEnv(
      "ALLOWED_FILE_TYPES",
      "image/*,application/pdf,application/zip,video/*,audio/*,text/*",
    )
  ).split(","),
  defaultRoomExpiryHours: Number(getEnv("DEFAULT_ROOM_EXPIRY_HOURS", "24")),
  clipboardHistoryLimit: Number(getEnv("CLIPBOARD_HISTORY_LIMIT", "50")),
  notesAutosaveIntervalMs: Number(getEnv("NOTES_AUTOSAVE_INTERVAL_MS", "3000")),
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
