-- Миграция 008: Файлы для заказов и фиксы предоплаты

-- 1. Добавляем колонку attachments (массив ссылок на файлы) в таблицу orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Создаем бакет для хранения файлов заказов (если его еще нет)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order_attachments', 'order_attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Временно создаем политики (RLS policies) для файлов вместо отключения RLS, чтобы избежать ошибки прав доступа
CREATE POLICY "Public Access Select" ON storage.objects FOR SELECT USING (bucket_id = 'order_attachments');
CREATE POLICY "Public Access Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'order_attachments');
CREATE POLICY "Public Access Update" ON storage.objects FOR UPDATE USING (bucket_id = 'order_attachments');
CREATE POLICY "Public Access Delete" ON storage.objects FOR DELETE USING (bucket_id = 'order_attachments');

-- 3. Добавляем привязку транзакций к заказам (чтобы обновлять предоплату)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;
