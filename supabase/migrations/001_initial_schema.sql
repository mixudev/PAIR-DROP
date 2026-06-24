-- PairDrop Database Schema
-- Run this migration in Supabase SQL Editor or via Supabase CLI

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE room_type AS ENUM ('pair', 'public', 'private');
CREATE TYPE pair_session_status AS ENUM ('waiting', 'connected', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'link', 'system');
CREATE TYPE activity_action AS ENUM (
  'room_created', 'member_joined', 'member_left',
  'file_uploaded', 'file_deleted', 'clipboard_sent',
  'note_updated', 'link_shared'
);

-- Users (optional)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type room_type NOT NULL DEFAULT 'private',
  is_public BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_expires_at ON rooms(expires_at) WHERE expires_at IS NOT NULL;

-- Room Members
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown Device',
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_host BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, device_id)
);

CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_device_id ON room_members(device_id);
CREATE INDEX idx_room_members_access_token ON room_members(access_token);

-- Pair Sessions
CREATE TABLE pair_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  status pair_session_status NOT NULL DEFAULT 'waiting',
  host_device_id TEXT NOT NULL,
  guest_device_id TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pair_sessions_token ON pair_sessions(token);
CREATE INDEX idx_pair_sessions_status ON pair_sessions(status);
CREATE INDEX idx_pair_sessions_expires_at ON pair_sessions(expires_at);

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by_device_id TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_files_room_id ON files(room_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- Messages (links & text)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type message_type NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  sender_device_id TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Clipboard Items
CREATE TABLE clipboard_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_device_id TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clipboard_items_room_id ON clipboard_items(room_id);
CREATE INDEX idx_clipboard_items_created_at ON clipboard_items(created_at DESC);

-- Notes
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT NOT NULL DEFAULT '',
  updated_by_device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_room_id ON notes(room_id);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  action activity_action NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_room_id ON activity_logs(room_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Room Settings
CREATE TABLE room_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
  max_file_size_mb INTEGER NOT NULL DEFAULT 50,
  clipboard_history_limit INTEGER NOT NULL DEFAULT 50,
  allow_file_upload BOOLEAN NOT NULL DEFAULT true,
  allow_guest_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_settings_updated_at
  BEFORE UPDATE ON room_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Expire pair sessions function
CREATE OR REPLACE FUNCTION expire_stale_pair_sessions()
RETURNS void AS $$
BEGIN
  UPDATE pair_sessions
  SET status = 'expired'
  WHERE status = 'waiting' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire rooms function
CREATE OR REPLACE FUNCTION expire_stale_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM rooms
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify room member access
CREATE OR REPLACE FUNCTION verify_room_access(
  p_room_id UUID,
  p_access_token TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = p_room_id AND access_token = p_access_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trim clipboard history (keep last N items)
CREATE OR REPLACE FUNCTION trim_clipboard_history(
  p_room_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS void AS $$
BEGIN
  DELETE FROM clipboard_items
  WHERE room_id = p_room_id
  AND id NOT IN (
    SELECT id FROM clipboard_items
    WHERE room_id = p_room_id
    ORDER BY created_at DESC
    LIMIT p_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anon access for realtime — server actions use service role)
CREATE POLICY "Allow read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Allow read room_members" ON room_members FOR SELECT USING (true);
CREATE POLICY "Allow read files" ON files FOR SELECT USING (true);
CREATE POLICY "Allow read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow read clipboard" ON clipboard_items FOR SELECT USING (true);
CREATE POLICY "Allow read notes" ON notes FOR SELECT USING (true);
CREATE POLICY "Allow read activity" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow read settings" ON room_settings FOR SELECT USING (true);
CREATE POLICY "Allow read pair_sessions" ON pair_sessions FOR SELECT USING (true);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE files;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE clipboard_items;
ALTER PUBLICATION supabase_realtime ADD TABLE notes;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE pair_sessions;
