-- Ensure required Supabase Storage buckets exist (idempotent).
-- Safe for new sites (MAVSAFE, etc.) where buckets were never created in the dashboard.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-media', 'project-media', true),
  ('project-marketing', 'project-marketing', true),
  ('deliverable-templates', 'deliverable-templates', false),
  ('ai-chat-images', 'ai-chat-images', true),
  ('contact-files', 'contact-files', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;
