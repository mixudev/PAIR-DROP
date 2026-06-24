"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import { shareLinkAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import { formatDistanceToNow } from "date-fns";

interface LinksPanelProps {
  roomId: string;
}

export function LinksPanel({ roomId }: LinksPanelProps) {
  const { messages, memberToken } = useWorkspaceStore();
  const { deviceId, deviceName } = useDeviceStore();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const links = messages.filter((m) => m.type === "link");

  const handleShare = async () => {
    if (!url.trim() || !memberToken) return;
    setIsSubmitting(true);
    const result = await shareLinkAction({
      roomId,
      accessToken: memberToken,
      url: url.trim(),
      deviceId,
      deviceName,
    });
    if (result.success) {
      setUrl("");
      toast.success("Link shared");
    } else {
      toast.error(result.error ?? "Failed to share link");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleShare()}
        />
        <Button onClick={handleShare} disabled={isSubmitting || !url.trim()}>
          <Plus className="mr-1 h-4 w-4" />
          Share
        </Button>
      </div>

      {links.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No links shared"
          description="Share URLs with all connected devices instantly"
        />
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-md border border-border p-4"
            >
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <a
                  href={link.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-primary hover:underline"
                >
                  {link.content}
                </a>
                <p className="text-xs text-muted-foreground">
                  {link.sender_name} ·{" "}
                  {formatDistanceToNow(new Date(link.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
