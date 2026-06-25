-- PairDrop Room Settings Enhancement Migration
-- Adds password support and room type toggling

-- Add password columns to room_settings
ALTER TABLE room_settings
  ADD COLUMN IF NOT EXISTS has_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS room_password TEXT;
