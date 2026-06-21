-- Миграция 008: Файлы для заказов и фиксы предоплаты

-- 1. Добавляем колонку attachments (массив ссылок на файлы) в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Создаем бакет для хранения файлов заказов (если его еще нет)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order_attachments', 'order_attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Временно отключаем RLS для файлов, чтобы работало в рамках MVP
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Добавляем привязку транзакций к заказам (чтобы обновлять предоплату)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
