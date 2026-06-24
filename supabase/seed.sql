-- LazShare Seed Data for Development
-- Run after 001_initial_schema.sql

INSERT INTO rooms (id, code, name, type, is_public, expires_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'LAZ-4827', 'Demo Public Room', 'public', true, NOW() + INTERVAL '24 hours'),
  ('a0000000-0000-0000-0000-000000000002', 'LAZ-7391', 'Team Workspace', 'private', false, NOW() + INTERVAL '24 hours');

INSERT INTO room_settings (room_id, max_file_size_mb, clipboard_history_limit)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 50, 50),
  ('a0000000-0000-0000-0000-000000000002', 50, 50);

INSERT INTO room_members (room_id, device_id, device_name, is_host)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'demo-device-1', 'MacBook Pro', true),
  ('a0000000-0000-0000-0000-000000000001', 'demo-device-2', 'iPhone 15', false),
  ('a0000000-0000-0000-0000-000000000002', 'demo-device-3', 'Windows PC', true);

INSERT INTO messages (room_id, type, content, sender_device_id, sender_name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'link', 'https://lazshare.app', 'demo-device-1', 'MacBook Pro'),
  ('a0000000-0000-0000-0000-000000000001', 'text', 'Welcome to LazShare demo room!', 'demo-device-2', 'iPhone 15');

INSERT INTO clipboard_items (room_id, content, sender_device_id, sender_name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'npm install lazshare', 'demo-device-1', 'MacBook Pro'),
  ('a0000000-0000-0000-0000-000000000001', 'const hello = "world";', 'demo-device-2', 'iPhone 15');

INSERT INTO notes (room_id, title, content, updated_by_device_id)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Meeting Notes', '# Sprint Planning\n\n- Review backlog\n- **Assign tasks**\n- Deploy to production', 'demo-device-1'),
  ('a0000000-0000-0000-0000-000000000002', 'Project Ideas', '## Features\n\n1. Real-time sync\n2. QR pairing\n3. File sharing', 'demo-device-3');

INSERT INTO activity_logs (room_id, action, metadata, device_id, device_name)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'room_created', '{"code": "LAZ-4827"}', 'demo-device-1', 'MacBook Pro'),
  ('a0000000-0000-0000-0000-000000000001', 'member_joined', '{}', 'demo-device-2', 'iPhone 15'),
  ('a0000000-0000-0000-0000-000000000001', 'clipboard_sent', '{"preview": "npm install"}', 'demo-device-1', 'MacBook Pro');
