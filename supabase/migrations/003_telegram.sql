-- Миграция: 003_telegram
-- Цель: Настройки интеграции с Telegram-ботом (зарезервировано по хронологии)

CREATE TABLE IF NOT EXISTS telegram_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT,
  chat_id TEXT
);

ALTER TABLE telegram_settings DISABLE ROW LEVEL SECURITY;
