-- Миграция: 004_currency_rates
-- Цель: Хранение курсов валют в БД (зарезервировано по хронологии)

CREATE TABLE IF NOT EXISTS currency_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  currency_code TEXT UNIQUE NOT NULL,
  rate_to_base NUMERIC NOT NULL
);

ALTER TABLE currency_rates DISABLE ROW LEVEL SECURITY;
