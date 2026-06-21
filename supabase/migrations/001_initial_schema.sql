-- Миграция: 001_initial_schema
-- Цель: Базовая структура проекта Unique Agency Manager (Лиды, Заказы, Финансы)

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_name TEXT NOT NULL,
  expected_sum NUMERIC,
  service_type TEXT,
  stage TEXT DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  cost NUMERIC,
  currency TEXT DEFAULT 'UZS',
  deadline DATE,
  service_type TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'UZS',
  category TEXT,
  status TEXT DEFAULT 'completed'
);

ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
