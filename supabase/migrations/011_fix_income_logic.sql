-- Миграция 011: Исправление финансовой логики доходов по заказам

-- 1. Добавляем флаг полной оплаты
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- 2. Функция для синхронизации доходов по заказам
CREATE OR REPLACE FUNCTION sync_order_income() RETURNS TRIGGER AS $$
DECLARE
  v_prepayment_tx_id UUID;
  v_debt_tx_id UUID;
BEGIN
  -- Находим существующую транзакцию предоплаты
  SELECT id INTO v_prepayment_tx_id FROM transactions 
  WHERE order_id = NEW.id AND type = 'income' AND source LIKE 'Предоплата по заказу:%' LIMIT 1;

  -- Логика предоплаты
  IF NEW.prepayment > 0 THEN
    IF v_prepayment_tx_id IS NOT NULL THEN
      UPDATE transactions 
      SET amount = NEW.prepayment, 
          currency = NEW.currency, 
          source = 'Предоплата по заказу: ' || NEW.title 
      WHERE id = v_prepayment_tx_id;
    ELSE
      INSERT INTO transactions (type, source, amount, currency, status, category, order_id, created_at)
      VALUES ('income', 'Предоплата по заказу: ' || NEW.title, NEW.prepayment, NEW.currency, 'completed', 'Проекты', NEW.id, COALESCE(NEW.created_at, NOW()));
    END IF;
  ELSE
    IF v_prepayment_tx_id IS NOT NULL THEN
      DELETE FROM transactions WHERE id = v_prepayment_tx_id;
    END IF;
  END IF;

  -- Находим существующую транзакцию остатка (долга)
  SELECT id INTO v_debt_tx_id FROM transactions 
  WHERE order_id = NEW.id AND type = 'income' AND source LIKE 'Остаток по заказу:%' LIMIT 1;

  -- Логика остатка
  IF NEW.is_paid = true AND (NEW.cost - COALESCE(NEW.prepayment, 0)) > 0 THEN
    IF v_debt_tx_id IS NOT NULL THEN
      UPDATE transactions 
      SET amount = NEW.cost - COALESCE(NEW.prepayment, 0), 
          currency = NEW.currency, 
          source = 'Остаток по заказу: ' || NEW.title 
      WHERE id = v_debt_tx_id;
    ELSE
      INSERT INTO transactions (type, source, amount, currency, status, category, order_id)
      VALUES ('income', 'Остаток по заказу: ' || NEW.title, NEW.cost - COALESCE(NEW.prepayment, 0), NEW.currency, 'completed', 'Проекты', NEW.id);
    END IF;
  ELSE
    IF v_debt_tx_id IS NOT NULL THEN
      DELETE FROM transactions WHERE id = v_debt_tx_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Создаем триггер, который реагирует на изменение стоимости, предоплаты, флага оплаты, названия и валюты
DROP TRIGGER IF EXISTS trg_sync_order_income ON orders;
CREATE TRIGGER trg_sync_order_income
AFTER INSERT OR UPDATE OF cost, prepayment, is_paid, title, currency
ON orders
FOR EACH ROW
EXECUTE FUNCTION sync_order_income();

-- 4. Очистка старых ручных транзакций (созданных клиентом без order_id или дублей)
DELETE FROM transactions 
WHERE type = 'income' 
AND category = 'Проекты' 
AND (source LIKE 'Предоплата по заказу:%' OR source LIKE 'Остаток по заказу:%');

-- 5. Обратное заполнение (Backfill) - принудительно вызываем триггер для всех заказов
UPDATE orders SET title = title;
