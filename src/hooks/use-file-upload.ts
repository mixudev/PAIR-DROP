"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { env, maxFileSizeBytes } from "@/config/env";
import { registerFileAction, getUploadUrlAction } from "@/actions";
import { useDeviceStore, useWorkspaceStore } from "@/stores";

export function useFileUpload(roomId: string) {
  const { deviceId, deviceName } = useDeviceStore();
  const { memberToken, updateUploadProgress, setUploadProgress } =
    useWorkspaceStore();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!memberToken) {
        toast.error("Not authorized to upload files");
        return;
      }

      const fileArray = Array.from(files);
      setIsUploading(true);

      const progressItems = fileArray.map((f) => ({
        fileName: f.name,
        progress: 0,
        status: "uploading" as const,
      }));
      setUploadProgress(progressItems);

      for (const file of fileArray) {
        if (file.size > maxFileSizeBytes) {
          toast.error(`${file.name} exceeds ${env.maxFileSizeMb}MB limit`);
          updateUploadProgress(file.name, { status: "error" });
          continue;
        }

        try {
          const pathResult = await getUploadUrlAction({
            roomId,
            accessToken: memberToken,
            fileName: file.name,
            deviceId,
          });

          if (!pathResult.success || !pathResult.data) {
            throw new Error(pathResult.error);
          }

          const supabase = createClient();
          const { storagePath } = pathResult.data;

          const { error: uploadError } = await supabase.storage
            .from(env.storageBucket)
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          updateUploadProgress(file.name, { progress: 80 });

          const registerResult = await registerFileAction({
            roomId,
            accessToken: memberToken,
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            deviceId,
            deviceName,
          });

          if (!registerResult.success) throw new Error(registerResult.error);

          updateUploadProgress(file.name, { progress: 100, status: "complete" });
          toast.success(`${file.name} uploaded`);
        } catch (error) {
          updateUploadProgress(file.name, { status: "error" });
          toast.error(
            error instanceof Error ? error.message : "Upload failed",
          );
        }
      }

      setIsUploading(false);
      setTimeout(() => setUploadProgress([]), 3000);
    },
    [
      roomId,
      memberToken,
      deviceId,
      deviceName,
      updateUploadProgress,
      setUploadProgress,
    ],
  );

  return { uploadFiles, isUploading };
}
