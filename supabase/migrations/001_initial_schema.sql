-- Миграция: 001_initial_schema
-- Цель: Базовые таблицы системы (Заказы, Транзакции, Лиды)

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  service_type TEXT,
  cost NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'UZS',
  deadline DATE,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT NOT NULL, -- 'income' or 'expense'
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'UZS',
  category TEXT,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_name TEXT NOT NULL,
  expected_sum NUMERIC DEFAULT 0,
  service_type TEXT,
  stage TEXT DEFAULT 'new'
);

-- Отключение RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
