-- Миграция: 002_wishlist
-- Цель: Добавление модуля списка желаний (зарезервировано по хронологии)

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  price NUMERIC,
  url TEXT
);

ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
