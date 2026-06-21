-- 1. Таблица сотрудников
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  status TEXT DEFAULT 'active'
);

-- 2. Обновление таблицы заказов
ALTER TABLE orders ADD COLUMN IF NOT EXISTS executor_id UUID REFERENCES employees(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS finder_id UUID REFERENCES employees(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Таблица задач (Канбан планировщик)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'todo',
  executor_id UUID REFERENCES employees(id)
);

-- 4. Отключение RLS для публичного MVP доступа
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
