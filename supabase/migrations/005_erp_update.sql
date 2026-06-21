-- Миграция: 001_erp_system_init
-- Цель: Добавление модуля Сотрудников, Планировщика задач (Kanban) и обновление таблицы Заказов

-- 1. Создание таблицы сотрудников
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  status TEXT DEFAULT 'active'
);

-- 2. Обновление таблицы заказов новыми колонками (IF NOT EXISTS поддерживается в современных версиях PostgreSQL)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS finder_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Создание таблицы задач (Для Планировщика)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'todo', -- Возможные значения: 'todo', 'shooting', 'editing', 'review', 'done'
  executor_id UUID REFERENCES employees(id)
);

-- 4. Отключение политик безопасности (RLS) для MVP, так как у нас нет встроенной системы аутентификации Supabase
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
