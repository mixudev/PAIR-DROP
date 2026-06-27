-- Add indexes for batch count queries in master room participant list

CREATE INDEX IF NOT EXISTS idx_files_room_id ON public.files (room_id);
CREATE INDEX IF NOT EXISTS idx_messages_room_id_type ON public.messages (room_id, type);
CREATE INDEX IF NOT EXISTS idx_clipboard_items_room_id ON public.clipboard_items (room_id);
