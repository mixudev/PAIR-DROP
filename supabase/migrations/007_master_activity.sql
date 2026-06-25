-- Add last_activity_at to master_room_participants
ALTER TABLE master_room_participants
ADD COLUMN last_activity_at TIMESTAMPTZ;

-- Update last_activity_at when content is created in participant's room
CREATE OR REPLACE FUNCTION update_master_participant_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE master_room_participants
  SET last_activity_at = NOW()
  WHERE participant_room_id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to files
CREATE TRIGGER on_participant_file_upload
  AFTER INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_master_participant_activity();

-- Apply to messages
CREATE TRIGGER on_participant_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_master_participant_activity();

-- Apply to clipboard_items
CREATE TRIGGER on_participant_clipboard_insert
  AFTER INSERT ON clipboard_items
  FOR EACH ROW
  EXECUTE FUNCTION update_master_participant_activity();
