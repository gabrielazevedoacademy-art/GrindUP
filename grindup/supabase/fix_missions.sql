-- =============================================================
-- Limpeza da tabela daily_missions
-- Execute no Supabase SQL Editor
-- =============================================================

-- 1. Remover missões de dias anteriores
DELETE FROM public.daily_missions
WHERE date < CURRENT_DATE;

-- 2. Para hoje, manter apenas as 3 primeiras por usuário (por created_at)
--    Remove qualquer excesso gerado por versões anteriores do código
DELETE FROM public.daily_missions
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id
             ORDER BY created_at ASC
           ) AS rn
    FROM public.daily_missions
    WHERE date = CURRENT_DATE
  ) ranked
  WHERE rn > 3
);

-- 3. Verificar resultado final
SELECT
  user_id,
  date,
  COUNT(*) AS mission_count,
  SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) AS completed_count
FROM public.daily_missions
GROUP BY user_id, date
ORDER BY date DESC;
