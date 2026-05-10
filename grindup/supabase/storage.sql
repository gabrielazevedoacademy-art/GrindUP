-- Cria buckets públicos
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers',  'covers',  true) ON CONFLICT DO NOTHING;

-- ── Policies: avatars ─────────────────────────────────────────────────────────
CREATE POLICY "Avatar leitura pública"   ON storage.objects FOR SELECT  USING (bucket_id = 'avatars');
CREATE POLICY "Avatar upload próprio"    ON storage.objects FOR INSERT  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar update próprio"    ON storage.objects FOR UPDATE  TO authenticated USING     (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar delete próprio"    ON storage.objects FOR DELETE  TO authenticated USING     (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Policies: covers ──────────────────────────────────────────────────────────
CREATE POLICY "Cover leitura pública"    ON storage.objects FOR SELECT  USING (bucket_id = 'covers');
CREATE POLICY "Cover upload próprio"     ON storage.objects FOR INSERT  TO authenticated WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Cover update próprio"     ON storage.objects FOR UPDATE  TO authenticated USING     (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Cover delete próprio"     ON storage.objects FOR DELETE  TO authenticated USING     (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
