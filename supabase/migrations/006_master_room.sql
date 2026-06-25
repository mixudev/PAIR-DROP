-- Add master room type
ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'master';

-- Track participants in master rooms
CREATE TABLE master_room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(master_room_id, device_id)
);

-- Index for faster participant lookups
CREATE INDEX idx_master_room_participants_master ON master_room_participants(master_room_id);
CREATE INDEX idx_master_room_participants_device ON master_room_participants(device_id);
