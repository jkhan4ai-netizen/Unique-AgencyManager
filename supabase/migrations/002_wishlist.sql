-- Миграция: 002_wishlist
-- Цель: Таблица списка желаний / планируемых покупок (Wishlist)

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'UZS',
  status TEXT DEFAULT 'active'
);

ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
