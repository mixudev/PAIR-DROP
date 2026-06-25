-- Function to clean up expired rooms and their files
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
DECLARE
  expired RECORD;
BEGIN
  FOR expired IN
    SELECT id FROM rooms
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
  LOOP
    -- Delete files from storage via trigger (files table records will cascade)
    DELETE FROM files WHERE room_id = expired.id;
    DELETE FROM messages WHERE room_id = expired.id;
    DELETE FROM clipboard_items WHERE room_id = expired.id;
    DELETE FROM activity_logs WHERE room_id = expired.id;
    DELETE FROM room_settings WHERE room_id = expired.id;
    DELETE FROM room_members WHERE room_id = expired.id;
    DELETE FROM rooms WHERE id = expired.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: auto-cleanup on room access attempt
CREATE OR REPLACE function check_room_expiry_and_cleanup()
RETURNS trigger AS $$
BEGIN
  IF OLD.expires_at IS NOT NULL AND OLD.expires_at < NOW() THEN
    DELETE FROM files WHERE room_id = OLD.id;
    DELETE FROM messages WHERE room_id = OLD.id;
    DELETE FROM clipboard_items WHERE room_id = OLD.id;
    DELETE FROM activity_logs WHERE room_id = OLD.id;
    DELETE FROM room_settings WHERE room_id = OLD.id;
    DELETE FROM room_members WHERE room_id = OLD.id;
    DELETE FROM rooms WHERE id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
