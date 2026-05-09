-- Adiciona suporte ao tipo 'pending' (A Receber) na tabela financial_transactions.
-- Execute este script no SQL Editor do Supabase Dashboard.

ALTER TABLE public.financial_transactions
  DROP CONSTRAINT IF EXISTS financial_transactions_type_check;

ALTER TABLE public.financial_transactions
  ADD CONSTRAINT financial_transactions_type_check
  CHECK (type IN ('income', 'expense', 'pending'));
