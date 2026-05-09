-- Adiciona coluna period e recria constraint único por turno
ALTER TABLE public.mood_checkins
  ADD COLUMN IF NOT EXISTS period VARCHAR(10)
  CHECK (period IN ('morning', 'afternoon', 'night'));

ALTER TABLE public.mood_checkins
  DROP CONSTRAINT IF EXISTS mood_checkins_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS mood_checkins_user_date_period
  ON public.mood_checkins(user_id, date, period);
