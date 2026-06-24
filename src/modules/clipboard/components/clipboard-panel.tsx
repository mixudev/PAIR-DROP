"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clipboard, ClipboardCopy, ClipboardPaste, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { sendClipboardAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import { formatDistanceToNow } from "date-fns";

interface ClipboardPanelProps {
  roomId: string;
}

export function ClipboardPanel({ roomId }: ClipboardPanelProps) {
  const { clipboardItems, memberToken } = useWorkspaceStore();
  const { deviceId, deviceName } = useDeviceStore();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim() || !memberToken) return;
    setIsSending(true);
    const result = await sendClipboardAction({
      roomId,
      accessToken: memberToken,
      content: content.trim(),
      deviceId,
      deviceName,
    });
    if (result.success) {
      toast.success("Clipboard sent to all devices");
    } else {
      toast.error(result.error ?? "Failed to send");
    }
    setIsSending(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Unable to access clipboard");
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Textarea
          placeholder="Paste text, code, links, or notes to sync across devices..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSend} disabled={isSending || !content.trim()}>
            <Clipboard className="mr-1 h-4 w-4" />
            Send Clipboard
          </Button>
          <Button variant="outline" onClick={handlePaste}>
            <ClipboardPaste className="mr-1 h-4 w-4" />
            Paste
          </Button>
          <Button variant="outline" onClick={() => setContent("")}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          History ({clipboardItems.length}/50)
        </h3>
        {clipboardItems.length === 0 ? (
          <EmptyState
            icon={Clipboard}
            title="No clipboard history"
            description="Sent clipboard items will appear here for quick access"
          />
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 pr-4">
              {clipboardItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group rounded-md border border-border p-3"
                >
                  <pre className="mb-2 max-h-24 overflow-hidden text-ellipsis whitespace-pre-wrap font-mono text-xs">
                    {item.content}
                  </pre>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.sender_name} ·{" "}
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => handleCopy(item.content)}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
