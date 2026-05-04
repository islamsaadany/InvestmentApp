-- ============================================================
-- 03-repair-vgt.sql  (RUN AFTER 02-backup.sql)
-- ============================================================
-- Purpose: Apply the missed 8:1 stock split for VGT on 2026-04-21.
--   - Multiply quantity by 8
--   - Divide purchase_price by 8
--   - Cost basis (price × quantity) stays exactly the same
--   - Insert a row into applied_splits so the Check Splits feature
--     and the 01-diagnostic.sql script know this split is handled
--
-- Wrapped in BEGIN/COMMIT — if any check fails, ROLLBACK manually
-- before the COMMIT line.
--
-- IMPORTANT: This script assumes there is exactly ONE VGT row.
-- The pre-flight check below will RAISE EXCEPTION if not.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Pre-flight: ensure exactly one VGT investment exists.
-- ------------------------------------------------------------
DO $$
DECLARE
  vgt_count INT;
BEGIN
  SELECT COUNT(*) INTO vgt_count
  FROM investments
  WHERE symbol = 'VGT' AND asset_type = 'us_stock';

  IF vgt_count <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly 1 VGT us_stock row, found %. Aborting repair.',
      vgt_count;
  END IF;
END $$;

-- ------------------------------------------------------------
-- BEFORE snapshot (for visual confirmation in the output).
-- ------------------------------------------------------------
SELECT
  'BEFORE'                                       AS stage,
  id, symbol, quantity,
  ROUND(purchase_price::numeric, 4)              AS purchase_price,
  ROUND((purchase_price * quantity)::numeric, 2) AS cost_basis
FROM investments
WHERE symbol = 'VGT' AND asset_type = 'us_stock';

-- ------------------------------------------------------------
-- The repair: 8-for-1 split.
-- ------------------------------------------------------------
UPDATE investments
SET
  quantity       = quantity * 8,
  purchase_price = purchase_price / 8,
  updated_at     = CURRENT_TIMESTAMP
WHERE symbol = 'VGT'
  AND asset_type = 'us_stock';

-- ------------------------------------------------------------
-- Record the split as 'applied' so future runs of Check Splits
-- and 01-diagnostic.sql treat this as handled. Uses the unique
-- index (symbol, split_date, investment_id) to be idempotent.
-- ------------------------------------------------------------
INSERT INTO applied_splits (
  symbol, split_date, ratio, numerator, denominator,
  action, investment_id, recorded_at
)
SELECT
  'VGT',
  DATE '2026-04-21',
  '8:1',
  8, 1,
  'applied'::"SplitAction",
  i.id,
  CURRENT_TIMESTAMP
FROM investments i
WHERE i.symbol = 'VGT'
  AND i.asset_type = 'us_stock'
ON CONFLICT (symbol, split_date, investment_id) DO NOTHING;

-- ------------------------------------------------------------
-- AFTER snapshot — confirm:
--   quantity went 1 -> 8
--   purchase_price went 716 -> 89.50
--   cost_basis unchanged at 716.00
-- ------------------------------------------------------------
SELECT
  'AFTER'                                        AS stage,
  id, symbol, quantity,
  ROUND(purchase_price::numeric, 4)              AS purchase_price,
  ROUND((purchase_price * quantity)::numeric, 2) AS cost_basis
FROM investments
WHERE symbol = 'VGT' AND asset_type = 'us_stock';

-- ------------------------------------------------------------
-- Confirm the applied_splits row was recorded.
-- ------------------------------------------------------------
SELECT
  id, symbol,
  TO_CHAR(split_date, 'YYYY-MM-DD') AS split_date,
  ratio, numerator, denominator, action, investment_id,
  TO_CHAR(recorded_at, 'YYYY-MM-DD HH24:MI') AS recorded_at
FROM applied_splits
WHERE symbol = 'VGT' AND split_date = DATE '2026-04-21';

-- ============================================================
-- Review the BEFORE/AFTER output above. If anything looks wrong,
-- run:  ROLLBACK;
-- Otherwise commit:
-- ============================================================
COMMIT;
