-- ============================================================
-- 01b-investigate.sql  (READ-ONLY)
-- ============================================================
-- Run each query block separately in Neon. Each one returns a
-- different view of your stocks data so we can find the real
-- cause of the phantom US Stocks decline.
-- ============================================================


-- ------------------------------------------------------------
-- Query 1: All split records (applied AND skipped)
-- Tells us if any splits have been recorded at all.
-- ------------------------------------------------------------
SELECT
  id,
  symbol,
  TO_CHAR(split_date, 'YYYY-MM-DD') AS split_date,
  ratio,
  numerator,
  denominator,
  action,
  investment_id,
  TO_CHAR(recorded_at, 'YYYY-MM-DD HH24:MI') AS recorded_at
FROM applied_splits
ORDER BY recorded_at DESC;


-- ------------------------------------------------------------
-- Query 2: All US stock investments (raw current state)
-- Lets us see the cost basis vs. quantity for each holding.
-- ------------------------------------------------------------
SELECT
  id,
  name,
  symbol,
  quantity,
  ROUND(purchase_price::numeric, 4)              AS purchase_price,
  purchase_currency,
  TO_CHAR(purchase_date, 'YYYY-MM-DD')           AS purchase_date,
  ROUND((purchase_price * quantity)::numeric, 2) AS cost_basis,
  valuation_mode
FROM investments
WHERE asset_type = 'us_stock'
ORDER BY (purchase_price * quantity) DESC;


-- ------------------------------------------------------------
-- Query 3: Total US stocks cost basis (in USD-equivalent)
-- Compare this to the dashboard "current value" of US Stocks
-- (~$1,665 from EGP 88,929.88 ÷ 53.42).
-- If cost_basis_usd is much higher than current value, there's
-- a phantom inflation (split bug or data entry).
-- ------------------------------------------------------------
SELECT
  COUNT(*)                                      AS num_holdings,
  ROUND(SUM(
    CASE
      WHEN purchase_currency = 'EGP' THEN (purchase_price * quantity) / 53.42
      ELSE purchase_price * quantity
    END
  )::numeric, 2)                                AS total_cost_basis_usd
FROM investments
WHERE asset_type = 'us_stock';


-- ------------------------------------------------------------
-- Query 4: Latest stored price for each US stock
-- Lets us spot-check: does the stored price look right vs
-- what you see on Yahoo today?
-- ------------------------------------------------------------
SELECT
  i.id,
  i.name,
  i.symbol,
  i.quantity,
  ROUND(i.purchase_price::numeric, 4)          AS purchase_price,
  ROUND(latest.price_usd::numeric, 4)          AS latest_stored_price_usd,
  TO_CHAR(latest.recorded_date, 'YYYY-MM-DD')  AS latest_price_date,
  ROUND((latest.price_usd * i.quantity)::numeric, 2) AS current_value_usd_estimate
FROM investments i
LEFT JOIN LATERAL (
  SELECT price_usd, recorded_date
  FROM asset_price_history
  WHERE symbol = i.symbol
  ORDER BY recorded_date DESC
  LIMIT 1
) latest ON true
WHERE i.asset_type = 'us_stock'
ORDER BY i.id;
