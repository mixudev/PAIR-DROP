"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  DoorOpen,
  Copy,
  Trash2,
  ExternalLink,
  Clock,
  Shield,
  Globe,
  Loader2,
  LogIn,
  RefreshCw,
  Camera,
  Scan,
  Lock,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/providers/auth-provider";
import { getUserRoomsAction, deleteRoomAction } from "@/actions/auth";
import { joinRoomAction, createMasterRoomAction } from "@/actions";
import { MEMBER_TOKEN_STORAGE_KEY, getRoomTokenKey } from "@/constants";
import { useDeviceStore } from "@/stores";
import { Header } from "@/components/layouts/header";
import { QRScannerInline } from "@/components/shared/qr-scanner";
import { toast } from "sonner";

interface RoomData {
  id: string;
  code: string;
  name: string | null;
  type: string;
  is_public: boolean;
  expires_at: string | null;
  created_at: string;
  room_members: { count: number }[];
  files: { count: number }[];
}

export function UserDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { deviceId, deviceName } = useDeviceStore();
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<{ code: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [creatingMaster, setCreatingMaster] = useState(false);

  const fetchRooms = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await getUserRoomsAction();
      if (result.success) {
        setRooms(result.data as RoomData[]);
      }
    } catch {
      toast.error("Gagal memuat data room");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteDialogId) return;
    setDeletingId(deleteDialogId);
    setDeleteDialogId(null);
    try {
      const result = await deleteRoomAction(deleteDialogId);
      if (result.success) {
        toast.success("Room dihapus");
        setRooms((prev) => prev.filter((r) => r.id !== deleteDialogId));
      } else {
        toast.error(result.error ?? "Gagal menghapus room");
      }
    } catch {
      toast.error("Gagal menghapus room");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateMasterRoom = useCallback(async () => {
    if (!deviceId) {
      toast.error("Device not initialized");
      return;
    }
    setCreatingMaster(true);
    try {
      const result = await createMasterRoomAction({
        name: "Master Room",
        expiryHours: 0,
        device: { deviceId, deviceName },
      });
      if (result.success && result.data) {
        const roomId = result.data.room.id;
        const token = result.data.member.access_token;
        localStorage.setItem(getRoomTokenKey(roomId), token);
        localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token);
        toast.success("Master room created!");
        router.push(`/master-room/${roomId}`);
      } else {
        toast.error(result.error ?? "Gagal membuat master room");
      }
    } finally {
      setCreatingMaster(false);
    }
  }, [deviceId, deviceName, router]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kode room disalin!");
  };

  const doJoinRoom = useCallback(async (code: string, password?: string) => {
    if (!deviceId || !code.trim()) return;
    setJoining(true);
    try {
      const cleaned = code.toUpperCase().replace(/\s/g, "");
      const result = await joinRoomAction({
        code: cleaned,
        device: { deviceId, deviceName },
        password,
      });
      if (result.success && result.data) {
        const roomId = result.data.room.id;
        const token = result.data.member.access_token;
        localStorage.setItem(getRoomTokenKey(roomId), token);
        localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token);
        toast.success(`Bergabung ke ${result.data.room.name}`);
        setJoinDialogOpen(false);
        setJoinCode("");
        router.push(`/workspace/${roomId}`);
      } else if ("needsPassword" in result && result.needsPassword) {
        setPasswordDialog({ code: cleaned });
      } else {
        toast.error(result.error ?? "Gagal bergabung");
      }
    } finally {
      setJoining(false);
    }
  }, [deviceId, deviceName, router]);

  const handleJoinRoom = useCallback(() => {
    doJoinRoom(joinCode);
  }, [joinCode, doJoinRoom]);

  const handleDashboardQRScan = useCallback((scanned: string) => {
    setScannerOpen(false);
    try {
      const url = new URL(scanned);
      const token = url.searchParams.get("token");
      const code = url.searchParams.get("code");
      const pathParts = url.pathname.split("/");
      const workspaceIdx = pathParts.indexOf("workspace");

      if (typeof token === "string" && token.length > 0 && workspaceIdx !== -1) {
        const roomId = pathParts[workspaceIdx + 1];
        if (typeof roomId === "string" && roomId.length > 0) {
          try { localStorage.setItem(getRoomTokenKey(roomId), token); } catch {}
          try { localStorage.setItem(MEMBER_TOKEN_STORAGE_KEY, token); } catch {}
          setJoinDialogOpen(false);
          router.push(`/workspace/${roomId}`);
          return;
        }
      }

      if (typeof token === "string" && token.length > 0) {
        router.push(`/pair/join?token=${encodeURIComponent(token)}`);
        return;
      }

      if (typeof code === "string" && code.length > 0) {
        doJoinRoom(code);
        return;
      }

      if (workspaceIdx !== -1) {
        const roomId = pathParts[workspaceIdx + 1];
        if (typeof roomId === "string" && roomId.length > 0) {
          router.push(`/workspace/${roomId}`);
          return;
        }
      }

      doJoinRoom(scanned);
    } catch {
      doJoinRoom(scanned);
    }
  }, [router, doJoinRoom]);

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "Tidak ada";
    const d = new Date(expiresAt);
    if (d < new Date()) return "Kedaluwarsa";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Login untuk akses Dashboard</h1>
          <p className="text-center text-sm text-muted-foreground">
            Dashboard hanya tersedia untuk pengguna yang sudah login.
          </p>
          <Button asChild>
            <Link href="/login?next=/dashboard">
              <LogIn className="mr-2 h-4 w-4" />
              Login dengan Google
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header showNav={false} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name ?? "User"}
            />
            <AvatarFallback className="text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user.user_metadata?.full_name ?? "Halo!"}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Total Room", value: rooms.length, icon: DoorOpen },
            { label: "Room Publik", value: rooms.filter((r) => r.is_public).length, icon: Globe },
            { label: "Room Private", value: rooms.filter((r) => !r.is_public).length, icon: Shield },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Room List */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Room Saya</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRooms}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setJoinDialogOpen(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Gabung Room
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateMasterRoom}
              disabled={creatingMaster}
            >
              {creatingMaster ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              Room Master
            </Button>
            <Button asChild size="sm">
              <Link href="/room/create">
                <Plus className="mr-2 h-4 w-4" />
                Buat Room
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rooms.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent className="flex flex-col items-center gap-4">
              <DoorOpen className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Belum ada room</p>
                <p className="text-sm text-muted-foreground">
                  Buat atau gabung room untuk mulai berbagi
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateMasterRoom} disabled={creatingMaster}>
                  {creatingMaster ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Monitor className="mr-2 h-4 w-4" />
                  )}
                  Room Master
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/room/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Room
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setJoinDialogOpen(true)}>
                  <Camera className="mr-2 h-4 w-4" />
                  Gabung Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <Card className="group hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base">
                          {room.name ?? `Room ${room.code}`}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                            {room.code}
                          </code>
                          <Badge
                            variant={room.is_public ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {room.is_public ? (
                              <>
                                <Globe className="mr-1 h-3 w-3" />
                                Publik
                              </>
                            ) : (
                              <>
                                <Shield className="mr-1 h-3 w-3" />
                                Private
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Kedaluwarsa: {formatExpiry(room.expires_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="default" size="sm" className="flex-1">
                        <Link href={`/workspace/${room.id}`}>
                          <ExternalLink className="mr-2 h-3.5 w-3.5" />
                          Buka
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(room.code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            disabled={deletingId === room.id}
                          >
                            {deletingId === room.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Room?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Room &quot;{room.name ?? room.code}&quot; akan dihapus
                              permanen beserta semua file dan pesan di dalamnya.
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => setDeleteDialogId(room.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Handle actual deletion triggered by AlertDialog */}
        {deleteDialogId && <DeleteHandler roomId={deleteDialogId} onConfirm={handleDelete} />}
      </main>

      {/* Join Room Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Gabung Room
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="join-code">Kode Room</Label>
              <div className="flex gap-2">
                <Input
                  id="join-code"
                  placeholder="PAIR-XXXX"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider flex-1"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setScannerOpen(true)}
                  title="Scan QR Code"
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleJoinRoom}
              disabled={joining || !joinCode.trim()}
            >
              {joining ? "Bergabung..." : "Gabung"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <QRScannerInline onScan={handleDashboardQRScan} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => { if (!open) { setPasswordDialog(null); setPasswordInput(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Kata Sandi Room
            </DialogTitle>
            <DialogDescription>
              Room ini dilindungi kata sandi. Masukkan kata sandi untuk bergabung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="password"
              placeholder="Masukkan kata sandi"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <Button
              className="w-full"
              disabled={!passwordInput.trim() || joining}
              onClick={() => {
                if (passwordDialog && passwordInput.trim()) {
                  const roomCode = passwordDialog.code;
                  setPasswordDialog(null);
                  setPasswordInput("");
                  doJoinRoom(roomCode, passwordInput);
                }
              }}
            >
              {joining ? "Bergabung..." : "Gabung"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteHandler({ onConfirm }: { roomId: string; onConfirm: () => void }) {
  useEffect(() => {
    onConfirm();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
