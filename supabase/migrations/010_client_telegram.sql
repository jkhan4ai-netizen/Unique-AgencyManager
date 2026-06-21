-- Миграция 010: Добавление Telegram клиента
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS telegram TEXT;
