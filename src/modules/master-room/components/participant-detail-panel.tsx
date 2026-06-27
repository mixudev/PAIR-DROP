"use client";

import { useState } from "react";
import { X, Download, ExternalLink, FileText, Link2, ClipboardCopy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getFileUrlAction } from "@/actions";
import { toast } from "sonner";
import type { MasterRoomParticipant, SharedFile, ClipboardItem, Message } from "@/types";

interface ParticipantContent {
  files: SharedFile[];
  clipboard: ClipboardItem[];
  links: Message[];
}

interface Props {
  participant: MasterRoomParticipant;
  content: ParticipantContent | null;
  loading: boolean;
  onClose: () => void;
}

function FileItem({ file }: { file: SharedFile }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await getFileUrlAction(file.storage_path, true);
      if (result.success && result.data) {
        const link = document.createElement("a");
        link.href = result.data;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        toast.error("Gagal mendapatkan URL file");
      }
    } finally {
      setDownloading(false);
    }
  };

  const size = file.file_size > 1024 * 1024
    ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`
    : `${(file.file_size / 1024).toFixed(1)} KB`;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.file_name}</p>
          <p className="text-xs text-muted-foreground">{size}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function LinkItem({ link }: { link: Message }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{link.content}</p>
          <p className="text-xs text-muted-foreground">Shared by {link.sender_name}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => window.open(link.content, "_blank")}>
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ClipboardItemRow({ item }: { item: ClipboardItem }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(item.content);
    toast.success("Teks disalin");
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 line-clamp-3 text-sm">{item.content}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("id-ID")}</p>
        <Button variant="ghost" size="icon" onClick={handleCopy}>
          <ClipboardCopy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ParticipantDetailPanel({ participant, content, loading, onClose }: Props) {
  const fileCount = content?.files.length ?? 0;
  const linkCount = content?.links.length ?? 0;
  const clipboardCount = content?.clipboard.length ?? 0;

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="font-semibold">{participant.display_name}</h3>
          <p className="text-xs text-muted-foreground">
            {fileCount} file &middot; {linkCount} link &middot; {clipboardCount} teks
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="files" className="flex flex-1 flex-col">
          <TabsList className="mx-3 mt-3">
            <TabsTrigger value="files" className="flex-1 gap-1.5">
              Files {fileCount > 0 && <Badge variant="secondary" className="ml-1 px-1.5">{fileCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="links" className="flex-1 gap-1.5">
              Links {linkCount > 0 && <Badge variant="secondary" className="ml-1 px-1.5">{linkCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="clipboard" className="flex-1 gap-1.5">
              Teks {clipboardCount > 0 && <Badge variant="secondary" className="ml-1 px-1.5">{clipboardCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="files" className="h-full p-3 pt-2">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {content?.files.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Belum ada file</p>
                  )}
                  {content?.files.map((f) => <FileItem key={f.id} file={f} />)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="links" className="h-full p-3 pt-2">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {content?.links.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Belum ada link</p>
                  )}
                  {content?.links.map((l) => <LinkItem key={l.id} link={l} />)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="clipboard" className="h-full p-3 pt-2">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {content?.clipboard.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">Belum ada teks</p>
                  )}
                  {content?.clipboard.map((c) => <ClipboardItemRow key={c.id} item={c} />)}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
