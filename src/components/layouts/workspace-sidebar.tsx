"use client";

import {
  Clipboard,
  Files,
  Link2,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WORKSPACE_SECTIONS } from "@/constants";
import { useWorkspaceStore } from "@/stores";
import type { WorkspaceSectionId } from "@/constants";

const iconMap = {
  Files,
  Link: Link2,
  Clipboard,
  Users,
  Settings,
};

interface WorkspaceSidebarProps {
  onSectionChange?: (section: WorkspaceSectionId) => void;
  className?: string;
}

export function WorkspaceSidebar({
  onSectionChange,
  className,
}: WorkspaceSidebarProps) {
  const { activeSection, setActiveSection, room, members } = useWorkspaceStore();

  const handleClick = (section: WorkspaceSectionId) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-r border-border bg-background md:w-56 lg:w-64",
        className,
      )}
    >
      <div className="border-b border-border p-4">
        <h2 className="truncate text-sm font-semibold">{room?.name}</h2>
        <p className="font-mono text-xs text-muted-foreground">{room?.code}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {members.length} device{members.length !== 1 ? "s" : ""} connected
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {WORKSPACE_SECTIONS.map((section) => {
          const Icon = iconMap[section.icon as keyof typeof iconMap];
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id as WorkspaceSectionId)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
