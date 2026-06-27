-- Allow multiple join sessions per device in master rooms
ALTER TABLE master_room_participants
DROP CONSTRAINT IF EXISTS master_room_participants_master_room_id_device_id_key;
