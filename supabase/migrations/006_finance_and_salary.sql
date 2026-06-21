-- Миграция 006: Расширенный финансовый модуль и зарплаты

-- 1. Обновление таблицы заказов
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prepayment NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS finder_amount NUMERIC DEFAULT 0;

-- 2. Обновление таблицы транзакций (привязка расходов к сотрудникам для авансов и зарплат)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Таблица категорий расходов
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Отключение RLS для новых таблиц (MVP режим)
ALTER TABLE expense_categories DISABLE ROW LEVEL SECURITY;

-- Вставка базовых категорий, если их нет
INSERT INTO expense_categories (name) VALUES 
('Общее'), 
('Маркетинг'), 
('Офис'), 
('Зарплаты и Авансы'), 
('Оборудование'),
('Налоги')
ON CONFLICT (name) DO NOTHING;
