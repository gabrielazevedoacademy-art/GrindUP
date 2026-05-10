-- Cria buckets públicos para avatares e capas
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers',  'covers',  true) ON CONFLICT (id) DO NOTHING;

-- ── Policies: avatars ─────────────────────────────────────────────────────────
CREATE POLICY "avatars: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: upload na própria pasta"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: atualizar próprios arquivos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: deletar próprios arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Policies: covers ──────────────────────────────────────────────────────────
CREATE POLICY "covers: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "covers: upload na própria pasta"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "covers: atualizar próprios arquivos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "covers: deletar próprios arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
