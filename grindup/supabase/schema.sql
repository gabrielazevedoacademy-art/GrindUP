-- =============================================================
-- GrindUP — Schema do banco de dados
-- =============================================================

-- -------------------------------------------------------------
-- EXTENSÕES
-- -------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================
-- TABELAS
-- =============================================================

-- -------------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT UNIQUE,
  full_name        TEXT,
  avatar_url       TEXT,
  cover_url        TEXT,
  plan             TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'elite')),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak_days      INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. tasks
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date     TIMESTAMPTZ,
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  xp_reward    INTEGER NOT NULL DEFAULT 10,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. goals
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  target_value  NUMERIC,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit          TEXT,
  deadline      DATE,
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward     INTEGER NOT NULL DEFAULT 100,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. financial_transactions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  amount     NUMERIC NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category   TEXT,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. events
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ,
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 6. mood_checkins
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mood_checkins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood       INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy     INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  notes      TEXT,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 7. daily_missions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_missions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  xp_reward    INTEGER NOT NULL DEFAULT 50,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8. plans
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT UNIQUE NOT NULL CHECK (name IN ('free', 'pro', 'elite')),
  display_name         TEXT NOT NULL,
  price                NUMERIC NOT NULL DEFAULT 0,
  max_tasks_per_month  INTEGER,   -- NULL = ilimitado
  max_active_goals     INTEGER,   -- NULL = ilimitado
  has_missions         BOOLEAN NOT NULL DEFAULT FALSE,
  has_weekly_summary   BOOLEAN NOT NULL DEFAULT FALSE,
  max_themes           INTEGER NOT NULL DEFAULT 1,
  has_elite_badge      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================
-- FUNÇÃO E TRIGGER: updated_at automático em profiles
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- FUNÇÃO E TRIGGER: criação automática de profile no cadastro
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_missions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------
-- Policies: profiles
-- -------------------------------------------------------------
CREATE POLICY "profiles: leitura própria"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: atualização própria"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT é feito pelo trigger (SECURITY DEFINER), sem policy necessária para usuários


-- -------------------------------------------------------------
-- Policies: tasks
-- -------------------------------------------------------------
CREATE POLICY "tasks: leitura própria"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks: inserção própria"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: atualização própria"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: exclusão própria"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: goals
-- -------------------------------------------------------------
CREATE POLICY "goals: leitura própria"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals: inserção própria"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: atualização própria"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: exclusão própria"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: financial_transactions
-- -------------------------------------------------------------
CREATE POLICY "financial_transactions: leitura própria"
  ON public.financial_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "financial_transactions: inserção própria"
  ON public.financial_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_transactions: atualização própria"
  ON public.financial_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "financial_transactions: exclusão própria"
  ON public.financial_transactions FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: events
-- -------------------------------------------------------------
CREATE POLICY "events: leitura própria"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "events: inserção própria"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: atualização própria"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: exclusão própria"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: mood_checkins
-- -------------------------------------------------------------
CREATE POLICY "mood_checkins: leitura própria"
  ON public.mood_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "mood_checkins: inserção própria"
  ON public.mood_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_checkins: atualização própria"
  ON public.mood_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mood_checkins: exclusão própria"
  ON public.mood_checkins FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: daily_missions
-- -------------------------------------------------------------
CREATE POLICY "daily_missions: leitura própria"
  ON public.daily_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_missions: inserção própria"
  ON public.daily_missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_missions: atualização própria"
  ON public.daily_missions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_missions: exclusão própria"
  ON public.daily_missions FOR DELETE
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- Policies: plans (leitura pública, sem escrita para usuários)
-- -------------------------------------------------------------
CREATE POLICY "plans: leitura pública"
  ON public.plans FOR SELECT
  USING (TRUE);


-- =============================================================
-- DADOS INICIAIS: planos
-- =============================================================
INSERT INTO public.plans
  (name, display_name, price, max_tasks_per_month, max_active_goals,
   has_missions, has_weekly_summary, max_themes, has_elite_badge)
VALUES
  ('free',  'Free',  0,     20,   3,    FALSE, FALSE, 1,    FALSE),
  ('pro',   'Pro',    9.90, NULL, NULL, TRUE,  TRUE,  5,    FALSE),
  ('elite', 'Elite', 19.90, NULL, NULL, TRUE,  TRUE,  9999, TRUE )
ON CONFLICT (name) DO NOTHING;
