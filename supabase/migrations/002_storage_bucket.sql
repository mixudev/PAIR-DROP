-- PairDrop Storage Bucket Setup
-- Run in Supabase SQL Editor after creating the bucket in Dashboard

-- Create bucket (also doable via Dashboard: Storage > New Bucket > "pairdrop-files", public: false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pairdrop-files',
  'pairdrop-files',
  false,
  52428800,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'text/plain', 'text/html', 'text/css', 'text/javascript',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pairdrop-files');

CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'pairdrop-files');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'pairdrop-files');

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'pairdrop-files');
