-- Миграция 007: CRM Клиенты

-- 1. Создание таблицы клиентов
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT
);

-- Отключение RLS для MVP
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 2. Связь таблицы заказов с клиентами
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- 3. Автоматическая миграция: перенос существующих клиентов из поля client_name в таблицу clients
DO $$ 
DECLARE
    r RECORD;
    new_client_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT client_name FROM orders WHERE client_name IS NOT NULL AND client_name != ''
    LOOP
        -- Проверяем, нет ли уже клиента с таким именем, чтобы избежать дублей (на всякий случай)
        IF NOT EXISTS (SELECT 1 FROM clients WHERE name = r.client_name) THEN
            INSERT INTO clients (name) VALUES (r.client_name)
            RETURNING id INTO new_client_id;
            
            -- Привязываем существующие заказы к новому client_id
            UPDATE orders SET client_id = new_client_id WHERE client_name = r.client_name;
        ELSE
            -- Если клиент уже есть (например, при повторном запуске скрипта), просто привязываем
            SELECT id INTO new_client_id FROM clients WHERE name = r.client_name LIMIT 1;
            UPDATE orders SET client_id = new_client_id WHERE client_name = r.client_name;
        END IF;
    END LOOP;
END $$;
