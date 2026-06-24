"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Download,
  ExternalLink,
  FileIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { deleteFileAction, getFileUrlAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { FileListSkeleton } from "@/components/shared/loading-skeleton";
import { useFileUpload } from "@/hooks/use-file-upload";
import { formatFileSize, isPreviewable } from "@/lib/utils";
import { useDeviceStore, useWorkspaceStore } from "@/stores";
import type { SharedFile } from "@/types";
import { formatDistanceToNow } from "date-fns";

function FileItem({ file }: { file: SharedFile }) {
  const { deviceId } = useDeviceStore();
  const { memberToken, room, removeFile } = useWorkspaceStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    const result = await getFileUrlAction(file.storage_path);
    if (result.success && result.data) {
      window.open(result.data, "_blank");
    } else {
      toast.error("Failed to get download link");
    }
  };

  const handleCopyLink = async () => {
    const result = await getFileUrlAction(file.storage_path);
    if (result.success && result.data) {
      await navigator.clipboard.writeText(result.data);
      toast.success("Link copied to clipboard");
    }
  };

  const handleDelete = async () => {
    if (!memberToken || !room) return;
    const result = await deleteFileAction({
      roomId: room.id,
      accessToken: memberToken,
      fileId: file.id,
      deviceId,
    });
    if (result.success) {
      removeFile(file.id);
      toast.success("File deleted");
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  };

  const handlePreview = async () => {
    if (!isPreviewable(file.mime_type)) return;
    const result = await getFileUrlAction(file.storage_path);
    if (result.success && result.data) {
      setPreviewUrl(result.data);
      setShowPreview(true);
    }
  };

  const canDelete =
    file.uploaded_by_device_id === deviceId ||
    useWorkspaceStore.getState().member?.is_host;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-md border border-border p-4 transition-colors hover:bg-muted/30"
    >
      <div
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md bg-muted"
        onClick={handlePreview}
      >
        {showPreview && previewUrl && isPreviewable(file.mime_type) ? (
          file.mime_type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.file_name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )
        ) : (
          <FileIcon className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.file_name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)} · {file.uploaded_by_name} ·{" "}
          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        {isPreviewable(file.mime_type) && (
          <Button variant="ghost" size="icon" onClick={handlePreview}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopyLink}>
          <Copy className="h-4 w-4" />
        </Button>
        {canDelete && (
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

interface FilePanelProps {
  roomId: string;
}

export function FilePanel({ roomId }: FilePanelProps) {
  const { files, uploadProgress } = useWorkspaceStore();
  const { uploadFiles, isUploading } = useFileUpload(roomId);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50"
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          Drag and drop files here
        </p>
        <p className="mb-4 text-xs text-muted-foreground">
          Images, PDF, Office docs, ZIP, video, audio, and more
        </p>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
          <span className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent">
            Browse Files
          </span>
        </label>
      </div>

      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((p) => (
            <div key={p.fileName} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">{p.fileName}</span>
                <span className="text-muted-foreground">
                  {p.status === "complete"
                    ? "Done"
                    : p.status === "error"
                      ? "Failed"
                      : `${p.progress}%`}
                </span>
              </div>
              <Progress value={p.progress} />
            </div>
          ))}
        </div>
      )}

      {files.length === 0 ? (
        <EmptyState
          icon={FileIcon}
          title="No files yet"
          description="Upload files to share them instantly with all connected devices"
        />
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FilePanelLoader() {
  return <FileListSkeleton />;
}
