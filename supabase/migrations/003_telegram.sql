-- Миграция: 003_telegram
-- Цель: Настройки для интеграции с Telegram (боты, чаты для уведомлений)

CREATE TABLE IF NOT EXISTS telegram_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bot_token TEXT,
  chat_id TEXT,
  is_active BOOLEAN DEFAULT false
);

ALTER TABLE telegram_settings DISABLE ROW LEVEL SECURITY;
