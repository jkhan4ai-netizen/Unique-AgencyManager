-- Миграция: 004_currency_rates
-- Цель: Хранение курсов валют (ручные настройки vs ЦБ)

CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  currency TEXT NOT NULL UNIQUE,
  rate_to_uzs NUMERIC NOT NULL,
  is_manual BOOLEAN DEFAULT false
);

ALTER TABLE currency_rates DISABLE ROW LEVEL SECURITY;
