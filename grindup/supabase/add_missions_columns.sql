-- =============================================================
-- Migração: adiciona colunas date e mission_type à daily_missions
-- e ajusta a estrutura para o sistema de missões diárias automáticas
-- =============================================================

-- 1. Adicionar colunas faltantes (IF NOT EXISTS para ser idempotente)
ALTER TABLE public.daily_missions
  ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS mission_type TEXT NOT NULL DEFAULT '';

-- 2. Remover constraint antiga se existir, e recriar
ALTER TABLE public.daily_missions
  DROP CONSTRAINT IF EXISTS daily_missions_user_id_date_mission_type_key;

ALTER TABLE public.daily_missions
  ADD CONSTRAINT daily_missions_user_id_date_mission_type_key
  UNIQUE (user_id, date, mission_type);

-- 3. Index de performance para queries por user + date
CREATE INDEX IF NOT EXISTS daily_missions_user_date
  ON public.daily_missions(user_id, date);

-- 4. Limpar registros antigos sem mission_type (se houver)
DELETE FROM public.daily_missions WHERE mission_type = '';

-- Verificar estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'daily_missions'
ORDER BY ordinal_position;
