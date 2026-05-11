-- Índices de performance para escalabilidade do GrindUP

-- Tarefas
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON public.tasks(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- Transações financeiras
CREATE INDEX IF NOT EXISTS idx_financial_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_user_date ON public.financial_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_financial_user_type ON public.financial_transactions(user_id, type);

-- Metas
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_completed ON public.goals(user_id, is_completed);

-- Eventos da agenda
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_start ON public.events(user_id, start_at);

-- Check-ins
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.mood_checkins(user_id, date);
CREATE INDEX IF NOT EXISTS idx_checkins_user_period ON public.mood_checkins(user_id, date, period);

-- Perfis
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(level);
