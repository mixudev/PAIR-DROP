-- ============================================
-- RLS Security Audit & Fixes
-- ============================================

-- 1. master_room_participants — missing RLS entirely
ALTER TABLE master_room_participants ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for anon (needed for realtime subscription)
CREATE POLICY "Allow read master_room_participants"
  ON master_room_participants FOR SELECT
  USING (true);

-- No write policies = block anon writes (INSERT/UPDATE/DELETE default-deny)
-- All mutations go through server actions with service_role (bypasses RLS)

-- 2. Re-verify all tables have RLS enabled
DO $$
DECLARE
  tbl TEXT;
  missing TEXT[] := '{}';
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'users', 'rooms', 'room_members', 'pair_sessions', 'files',
      'messages', 'clipboard_items', 'notes', 'activity_logs',
      'room_settings', 'master_room_participants', 'user_room_tokens'
    ])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE tablename = tbl
      AND rowsecurity = true
    ) THEN
      missing := array_append(missing, tbl);
    END IF;
  END LOOP;

  IF array_length(missing, 1) > 0 THEN
    RAISE WARNING 'Tables missing RLS: %', array_to_string(missing, ', ');
  END IF;
END;
$$ LANGUAGE plpgsql;
