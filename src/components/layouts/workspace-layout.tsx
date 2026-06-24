"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getRoomDataAction } from "@/actions";
import { Header } from "@/components/layouts/header";
import { WorkspaceSidebar } from "@/components/layouts/workspace-sidebar";
import { ConnectionIndicator } from "@/components/shared/connection-indicator";
import { WorkspaceSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { FilePanel } from "@/modules/files/components/file-panel";
import { LinksPanel } from "@/modules/clipboard/components/links-panel";
import { ClipboardPanel } from "@/modules/clipboard/components/clipboard-panel";
import { MembersPanel } from "@/modules/rooms/components/members-panel";
import { SettingsPanel } from "@/modules/settings/components/settings-panel";
import { useRoomRealtime, useHeartbeat } from "@/hooks/use-realtime";
import { MEMBER_TOKEN_STORAGE_KEY } from "@/constants";
import { useWorkspaceStore } from "@/stores";

const sectionTitles: Record<string, string> = {
  files: "Files",
  links: "Links",
  clipboard: "Clipboard",
  members: "Members",
  settings: "Settings",
};

export function WorkspaceLayout() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeSection,
    connectionStatus,
    member,
    setRoom,
    setMember,
    setMembers,
    setFiles,
    setMessages,
    setClipboardItems,
    setActivities,
    memberToken,
    setMemberToken,
  } = useWorkspaceStore();

  useRoomRealtime(roomId);
  useHeartbeat(roomId, member?.id ?? null);

  useEffect(() => {
    async function loadRoom() {
      const token =
        memberToken ??
        (typeof window !== "undefined"
          ? localStorage.getItem(MEMBER_TOKEN_STORAGE_KEY)
          : null);

      if (!token) {
        setError("Not a member of this room. Please join first.");
        setIsLoading(false);
        return;
      }

      setMemberToken(token);
      const result = await getRoomDataAction(roomId, token);

      if (result.success && result.data) {
        const d = result.data;
        setRoom(d.room);
        setMember(d.member);
        setMembers(d.members);
        setFiles(d.files);
        setMessages(d.messages);
        setClipboardItems(d.clipboardItems);
        setActivities(d.activities);
      } else {
        setError(result.error ?? "Failed to load room");
      }
      setIsLoading(false);
    }

    loadRoom();
  }, [
    roomId,
    memberToken,
    setRoom,
    setMember,
    setMembers,
    setFiles,
    setMessages,
    setClipboardItems,
    setActivities,
    setMemberToken,
  ]);

  if (isLoading) return <WorkspaceSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <p className="mb-4 text-destructive">{error}</p>
            <Button asChild variant="outline">
              <a href="/room/join">Join a Room</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "files":
        return <FilePanel roomId={roomId} />;
      case "links":
        return <LinksPanel roomId={roomId} />;
      case "clipboard":
        return <ClipboardPanel roomId={roomId} />;
      case "members":
        return <MembersPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <FilePanel roomId={roomId} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header showNav={false} />
      <div className="relative flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <WorkspaceSidebar
          onSectionChange={() => setSidebarOpen(false)}
          className={`${
            sidebarOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"
          } top-14 md:relative md:top-0 md:flex`}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">
                  {sectionTitles[activeSection]}
                </h1>
              </div>
              <ConnectionIndicator status={connectionStatus} />
            </div>
          </div>
          <div className="p-4 sm:p-6">{renderContent()}</div>
        </main>

        {sidebarOpen && (
          <Button
            size="icon"
            variant="outline"
            className="fixed bottom-4 right-4 z-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
