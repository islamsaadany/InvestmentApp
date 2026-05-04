-- ============================================================
-- 01-diagnostic.sql  (READ-ONLY — safe to run any time)
-- ============================================================
-- Purpose: Find every investment whose purchase_price is wrong
-- because a split was applied (quantity was multiplied) but the
-- purchase price was never adjusted.
--
-- For each affected investment, this script shows:
--   - current purchase_price (wrong)
--   - corrected purchase_price (what it should be)
--   - cumulative split factor (product of all applied splits)
--   - current cost basis  = purchase_price × quantity (inflated)
--   - correct cost basis  = corrected × quantity (real money paid)
--
-- Compounds multiple splits on the same investment.
-- Excludes splits that were "skipped" by the user.
-- ============================================================

WITH cumulative AS (
  SELECT
    investment_id,
    -- Compound all applied splits: e.g., 2-for-1 then 3-for-1 → factor 6
    EXP(SUM(LN(numerator / denominator))) AS total_factor,
    COUNT(*)                              AS split_count,
    STRING_AGG(
      ratio || ' on ' || TO_CHAR(split_date, 'YYYY-MM-DD'),
      ', '
      ORDER BY split_date
    ) AS splits_summary
  FROM applied_splits
  WHERE action = 'applied'
    AND investment_id IS NOT NULL
  GROUP BY investment_id
)
SELECT
  i.id                                              AS investment_id,
  i.name,
  i.symbol,
  i.asset_type,
  c.split_count,
  c.splits_summary,
  ROUND(c.total_factor::numeric, 4)                 AS cumulative_factor,
  i.quantity                                        AS current_quantity,
  ROUND(i.purchase_price::numeric, 4)               AS current_purchase_price,
  ROUND((i.purchase_price / c.total_factor)::numeric, 4) AS corrected_purchase_price,
  i.purchase_currency,
  ROUND((i.purchase_price * i.quantity)::numeric, 2)                     AS current_cost_basis,
  ROUND(((i.purchase_price / c.total_factor) * i.quantity)::numeric, 2)  AS corrected_cost_basis,
  ROUND(((i.purchase_price * i.quantity)
        - ((i.purchase_price / c.total_factor) * i.quantity))::numeric, 2)
                                                    AS phantom_cost_inflation
FROM investments i
JOIN cumulative c ON c.investment_id = i.id
ORDER BY phantom_cost_inflation DESC;
