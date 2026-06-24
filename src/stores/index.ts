import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEVICE_STORAGE_KEY,
  MEMBER_TOKEN_STORAGE_KEY,
  type ConnectionStatus,
  type WorkspaceSectionId,
} from "@/constants";
import type {
  ActivityLog,
  ClipboardItem,
  Message,
  Note,
  Room,
  RoomMember,
  SharedFile,
  UploadProgress,
} from "@/types";

interface DeviceState {
  deviceId: string;
  deviceName: string;
  setDeviceName: (name: string) => void;
  initDevice: () => void;
}

interface WorkspaceState {
  room: Room | null;
  member: RoomMember | null;
  members: RoomMember[];
  files: SharedFile[];
  messages: Message[];
  clipboardItems: ClipboardItem[];
  notes: Note[];
  activities: ActivityLog[];
  connectionStatus: ConnectionStatus;
  activeSection: WorkspaceSectionId;
  uploadProgress: UploadProgress[];
  memberToken: string | null;
  setRoom: (room: Room | null) => void;
  setMember: (member: RoomMember | null) => void;
  setMembers: (members: RoomMember[]) => void;
  setFiles: (files: SharedFile[]) => void;
  addFile: (file: SharedFile) => void;
  removeFile: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setClipboardItems: (items: ClipboardItem[]) => void;
  addClipboardItem: (item: ClipboardItem) => void;
  setNotes: (notes: Note[]) => void;
  updateNote: (note: Note) => void;
  addNote: (note: Note) => void;
  setActivities: (activities: ActivityLog[]) => void;
  addActivity: (activity: ActivityLog) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveSection: (section: WorkspaceSectionId) => void;
  setUploadProgress: (progress: UploadProgress[]) => void;
  updateUploadProgress: (fileName: string, progress: Partial<UploadProgress>) => void;
  setMemberToken: (token: string | null) => void;
  reset: () => void;
}

function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_STORAGE_KEY, id);
  }
  return id;
}

function detectDeviceName(): string {
  if (typeof window === "undefined") return "Unknown Device";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS Device";
  if (/Android/.test(ua)) return "Android Device";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux PC";
  return "Unknown Device";
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      deviceId: "",
      deviceName: "Unknown Device",
      setDeviceName: (name) => set({ deviceName: name }),
      initDevice: () => {
        const deviceId = getOrCreateDeviceId();
        const stored = get();
        set({
          deviceId,
          deviceName: stored.deviceName === "Unknown Device"
            ? detectDeviceName()
            : stored.deviceName,
        });
      },
    }),
    {
      name: "pairdrop-device",
      partialize: (state) => ({
        deviceName: state.deviceName,
      }),
    },
  ),
);

const initialWorkspace = {
  room: null as Room | null,
  member: null as RoomMember | null,
  members: [] as RoomMember[],
  files: [] as SharedFile[],
  messages: [] as Message[],
  clipboardItems: [] as ClipboardItem[],
  notes: [] as Note[],
  activities: [] as ActivityLog[],
  connectionStatus: "disconnected" as ConnectionStatus,
  activeSection: "files" as WorkspaceSectionId,
  uploadProgress: [] as UploadProgress[],
  memberToken: null as string | null,
};

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  ...initialWorkspace,
  setRoom: (room) => set({ room }),
  setMember: (member) => {
    if (member && typeof window !== "undefined") {
      localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, member.access_token);
    }
    set({ member, memberToken: member?.access_token ?? null });
  },
  setMembers: (members) => set({ members }),
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((s) => ({ files: [file, ...s.files] })),
  removeFile: (id) =>
    set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((s) => ({ messages: [message, ...s.messages] })),
  setClipboardItems: (clipboardItems) => set({ clipboardItems }),
  addClipboardItem: (item) =>
    set((s) => ({
      clipboardItems: [item, ...s.clipboardItems].slice(0, 50),
    })),
  setNotes: (notes) => set({ notes }),
  updateNote: (note) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === note.id ? note : n)),
    })),
  addNote: (note) =>
    set((s) => ({ notes: [note, ...s.notes] })),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) =>
    set((s) => ({
      activities: [activity, ...s.activities].slice(0, 10),
    })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  updateUploadProgress: (fileName, progress) =>
    set((s) => ({
      uploadProgress: s.uploadProgress.map((p) =>
        p.fileName === fileName ? { ...p, ...progress } : p,
      ),
    })),
  setMemberToken: (memberToken) => {
    if (memberToken && typeof window !== "undefined") {
      localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, memberToken);
    }
    set({ memberToken });
  },
  reset: () => set(initialWorkspace),
}));
