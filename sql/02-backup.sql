-- ============================================================
-- 02-backup.sql  (RUN BEFORE 03-repair-vgt.sql)
-- ============================================================
-- Purpose: Snapshot the VGT investment row(s) BEFORE repair so
-- we can restore exactly if anything goes wrong.
--
-- Creates a backup table (IF NOT EXISTS) and inserts a copy of
-- every VGT row, tagged with a timestamp + reason note.
--
-- Safe to re-run: each backup is a new INSERT (history kept).
-- ============================================================

CREATE TABLE IF NOT EXISTS investments_backup (
  backup_id        SERIAL PRIMARY KEY,
  backed_up_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason           TEXT,
  -- Mirror of investments columns
  id               INT,
  name             VARCHAR(200),
  symbol           VARCHAR(50),
  asset_type       TEXT,
  quantity         DOUBLE PRECISION,
  purchase_price   DOUBLE PRECISION,
  purchase_currency VARCHAR(10),
  purchase_date    TIMESTAMP,
  weight_unit      TEXT,
  notes            VARCHAR(500),
  created_at       TIMESTAMP,
  updated_at       TIMESTAMP
);

INSERT INTO investments_backup (
  reason,
  id, name, symbol, asset_type, quantity, purchase_price,
  purchase_currency, purchase_date, weight_unit, notes,
  created_at, updated_at
)
SELECT
  'pre-repair: VGT 8:1 split on 2026-04-21',
  id, name, symbol, asset_type::text, quantity, purchase_price,
  purchase_currency, purchase_date, weight_unit::text, notes,
  created_at, updated_at
FROM investments
WHERE symbol = 'VGT'
  AND asset_type = 'us_stock';

-- Verify the backup. Should show one row with the WRONG values
-- (quantity=1, purchase_price=716) — that's what we're saving.
SELECT
  backup_id,
  backed_up_at,
  reason,
  id              AS investment_id,
  symbol,
  quantity,
  ROUND(purchase_price::numeric, 4) AS purchase_price,
  ROUND((purchase_price * quantity)::numeric, 2) AS cost_basis
FROM investments_backup
WHERE reason LIKE 'pre-repair: VGT 8:1%'
ORDER BY backed_up_at DESC;
