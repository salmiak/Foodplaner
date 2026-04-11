-- Create the recipe-images storage bucket (public read, authenticated write)

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload images
CREATE POLICY "Authenticated users can upload recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can replace/update images
CREATE POLICY "Authenticated users can update recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

-- Authenticated users can delete images
CREATE POLICY "Authenticated users can delete recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
  );

-- Public read (bucket is already public, but explicit policy for clarity)
CREATE POLICY "Public can view recipe images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');
