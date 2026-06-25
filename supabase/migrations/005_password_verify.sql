-- Add password verification tracking to room_members
ALTER TABLE room_members ADD COLUMN password_verified_at TIMESTAMPTZ;

-- Add password update tracking to room_settings
ALTER TABLE room_settings ADD COLUMN password_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set password_updated_at for existing settings that have passwords
UPDATE room_settings SET password_updated_at = updated_at WHERE has_password = true;
