-- ============================================================
-- 04-repair-snapshots.sql  (RUN AFTER 03-repair-vgt.sql)
-- ============================================================
-- Purpose: Patch the historical performance line chart.
--
-- Problem: Daily portfolio_snapshots rows from 2026-04-21 onward
-- were computed with VGT quantity=1 (pre-split), so each one is
-- missing the value of 7 "phantom" shares. The Performance chart
-- shows a fake ~$700 cliff on Apr 21.
--
-- Fix: For each snapshot dated >= 2026-04-21:
--   1. Look up VGT's price on (or nearest <=) that snapshot's date
--      from asset_price_history.
--   2. Add (7 × vgt_price_usd) to total_value_usd.
--   3. Add the same delta in EGP using the ORIGINAL fx ratio from
--      that snapshot (preserves the historical exchange rate).
--
-- Safety:
--   - Wrapped in BEGIN/COMMIT.
--   - Backs up affected snapshots into portfolio_snapshots_backup
--     BEFORE updating.
--   - Idempotent: only updates snapshots NOT already in the backup
--     table with this exact reason. Re-running won't double-apply.
--   - Skips snapshots where no VGT price is available (flagged in
--     the diagnostic select at the bottom).
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Pre-flight: VGT repair must have run already.
-- ------------------------------------------------------------
DO $$
DECLARE
  applied_count INT;
BEGIN
  SELECT COUNT(*) INTO applied_count
  FROM applied_splits
  WHERE symbol = 'VGT'
    AND split_date = DATE '2026-04-21'
    AND action = 'applied';

  IF applied_count = 0 THEN
    RAISE EXCEPTION
      'VGT 8:1 split has not been applied yet. Run 03-repair-vgt.sql first.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- Create the snapshot backup table (mirror of portfolio_snapshots).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_snapshots_backup (
  backup_id        SERIAL PRIMARY KEY,
  backed_up_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason           TEXT,
  id               INT,
  total_value_usd  DOUBLE PRECISION,
  total_value_egp  DOUBLE PRECISION,
  snapshot_date    TIMESTAMP
);

-- ------------------------------------------------------------
-- Backup ONLY snapshots not yet backed up under this reason
-- (idempotency anchor — also used to filter the UPDATE below).
-- ------------------------------------------------------------
INSERT INTO portfolio_snapshots_backup (
  reason, id, total_value_usd, total_value_egp, snapshot_date
)
SELECT
  'pre-repair: VGT 8:1 split snapshot patch',
  ps.id, ps.total_value_usd, ps.total_value_egp, ps.snapshot_date
FROM portfolio_snapshots ps
WHERE ps.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM portfolio_snapshots_backup b
    WHERE b.id = ps.id
      AND b.reason = 'pre-repair: VGT 8:1 split snapshot patch'
  );

-- ------------------------------------------------------------
-- BEFORE snapshot of the affected rows.
-- ------------------------------------------------------------
SELECT
  'BEFORE' AS stage,
  ps.id,
  TO_CHAR(ps.snapshot_date, 'YYYY-MM-DD')              AS snapshot_date,
  ROUND(ps.total_value_usd::numeric, 2)                AS total_value_usd,
  ROUND(ps.total_value_egp::numeric, 2)                AS total_value_egp,
  ROUND((ps.total_value_egp / NULLIF(ps.total_value_usd, 0))::numeric, 4) AS fx_ratio
FROM portfolio_snapshots ps
WHERE ps.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
ORDER BY ps.snapshot_date;

-- ------------------------------------------------------------
-- Diagnostic: snapshots that have NO usable VGT price (will be
-- skipped by the UPDATE — review these manually if any appear).
-- ------------------------------------------------------------
SELECT
  'NO_PRICE_SKIPPED' AS stage,
  ps.id,
  TO_CHAR(ps.snapshot_date, 'YYYY-MM-DD') AS snapshot_date
FROM portfolio_snapshots ps
WHERE ps.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
  AND NOT EXISTS (
    SELECT 1
    FROM asset_price_history h
    WHERE h.symbol = 'VGT'
      AND h.recorded_date <= DATE(ps.snapshot_date)
  );

-- ------------------------------------------------------------
-- The patch.
-- For each affected snapshot, find the most recent VGT price on
-- or before the snapshot's date, then add (7 × that price) to USD
-- and the same delta scaled by the snapshot's original fx ratio
-- to EGP.
--
-- Only touches snapshots that are present in the backup table for
-- this reason — i.e. those we just backed up — so re-running the
-- script after a successful commit will be a no-op (the second
-- run finds nothing new to back up, so nothing new to update).
-- ------------------------------------------------------------
UPDATE portfolio_snapshots ps
SET
  total_value_usd = ps.total_value_usd + (7 * vgt.price_usd),
  total_value_egp = ps.total_value_egp +
    (7 * vgt.price_usd
       * (ps.total_value_egp / NULLIF(ps.total_value_usd, 0)))
FROM (
  SELECT
    ps2.id AS snapshot_id,
    (
      SELECT h.price_usd
      FROM asset_price_history h
      WHERE h.symbol = 'VGT'
        AND h.recorded_date <= DATE(ps2.snapshot_date)
      ORDER BY h.recorded_date DESC
      LIMIT 1
    ) AS price_usd
  FROM portfolio_snapshots ps2
  WHERE ps2.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
    AND EXISTS (
      SELECT 1 FROM portfolio_snapshots_backup b
      WHERE b.id = ps2.id
        AND b.reason = 'pre-repair: VGT 8:1 split snapshot patch'
        AND b.backed_up_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    )
) vgt
WHERE ps.id = vgt.snapshot_id
  AND vgt.price_usd IS NOT NULL;

-- ------------------------------------------------------------
-- AFTER snapshot — confirm the patch added ~7×price to each row.
-- ------------------------------------------------------------
SELECT
  'AFTER' AS stage,
  ps.id,
  TO_CHAR(ps.snapshot_date, 'YYYY-MM-DD')              AS snapshot_date,
  ROUND(ps.total_value_usd::numeric, 2)                AS total_value_usd,
  ROUND(ps.total_value_egp::numeric, 2)                AS total_value_egp,
  ROUND((ps.total_value_egp / NULLIF(ps.total_value_usd, 0))::numeric, 4) AS fx_ratio
FROM portfolio_snapshots ps
WHERE ps.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
ORDER BY ps.snapshot_date;

-- ------------------------------------------------------------
-- Per-snapshot delta breakdown (handy for visual sanity check).
-- ------------------------------------------------------------
SELECT
  TO_CHAR(ps.snapshot_date, 'YYYY-MM-DD')                  AS snapshot_date,
  ROUND(b.total_value_usd::numeric, 2)                     AS old_usd,
  ROUND(ps.total_value_usd::numeric, 2)                    AS new_usd,
  ROUND((ps.total_value_usd - b.total_value_usd)::numeric, 2) AS delta_usd
FROM portfolio_snapshots ps
JOIN portfolio_snapshots_backup b
  ON b.id = ps.id
 AND b.reason = 'pre-repair: VGT 8:1 split snapshot patch'
WHERE ps.snapshot_date >= TIMESTAMP '2026-04-21 00:00:00'
ORDER BY ps.snapshot_date;

-- ============================================================
-- Review the BEFORE/AFTER + delta breakdown above. Each delta_usd
-- should be roughly 7 × that day's VGT price (~$700-800 range
-- given the ~$100 split-adjusted price).
--
-- If anything looks wrong, run:  ROLLBACK;
-- Otherwise commit:
-- ============================================================
COMMIT;
