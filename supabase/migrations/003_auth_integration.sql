-- PairDrop Auth Integration Migration
-- Adds optional Google Auth support, per-room token storage for recovery,
-- and user dashboard support.

-- ============================================================
-- 1. Add user_id to rooms (link room to authenticated user)
-- ============================================================
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON rooms(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 2. Add user_id to room_members (link member to authenticated user)
-- ============================================================
ALTER TABLE room_members
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 3. User room tokens table (for token recovery when logged in)
-- Stores the access_token per user per room so they can recover
-- access even if localStorage is cleared.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_room_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES room_members(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_user_room_tokens_user_id ON user_room_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_room_tokens_room_id ON user_room_tokens(room_id);

CREATE TRIGGER update_user_room_tokens_updated_at
  BEFORE UPDATE ON user_room_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. RLS for user_room_tokens
-- ============================================================
ALTER TABLE user_room_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users read own room tokens"
  ON user_room_tokens FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users insert own room tokens"
  ON user_room_tokens FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own tokens
CREATE POLICY "Users update own room tokens"
  ON user_room_tokens FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users delete own room tokens"
  ON user_room_tokens FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 5. Updated RLS for rooms — authenticated users can see their rooms
-- ============================================================
-- Keep existing "Allow read rooms" policy (public read)
-- Add policy for authenticated users to manage their own rooms
CREATE POLICY "Authenticated users can update own rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Authenticated users can delete own rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 6. Function: Get rooms by user_id (for dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_rooms(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  code TEXT,
  name TEXT,
  type room_type,
  is_public BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT,
  file_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.code,
    r.name,
    r.type,
    r.is_public,
    r.expires_at,
    r.created_at,
    r.updated_at,
    (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) AS member_count,
    (SELECT COUNT(*) FROM files f WHERE f.room_id = r.id) AS file_count
  FROM rooms r
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_rooms(UUID) TO authenticated;

-- ============================================================
-- 7. Realtime for user_room_tokens
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_room_tokens;
