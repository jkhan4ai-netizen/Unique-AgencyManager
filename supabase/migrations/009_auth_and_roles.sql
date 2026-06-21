-- Миграция 009: Интеграция Supabase Auth и Ролей

-- 1. Добавляем поля в таблицу сотрудников для привязки к авторизации
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Функция-триггер для автоматического создания сотрудника при регистрации в Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Проверяем, первый ли это зарегистрированный пользователь в базе
  SELECT count(*) = 1 INTO is_first_user FROM auth.users;
  
  INSERT INTO public.employees (user_id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    CASE WHEN is_first_user THEN 'admin' ELSE 'employee' END,
    CASE WHEN is_first_user THEN 'active' ELSE 'pending' END
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Привязываем триггер к таблице auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
