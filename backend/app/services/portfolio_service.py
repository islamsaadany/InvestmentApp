from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Investment, PortfolioSnapshot
from app.schemas import PortfolioSummary, PortfolioSnapshotResponse
from app.services.investment_service import get_investments, enrich_investments
from app.market_data import get_usd_to_egp_rate


async def get_portfolio_summary(db: AsyncSession) -> PortfolioSummary:
    """Get full portfolio summary with P&L and allocation."""
    investments = await get_investments(db)
    enriched = await enrich_investments(investments)
    egp_rate = await get_usd_to_egp_rate()

    total_value_usd = sum(i.current_value_usd or 0 for i in enriched)
    total_value_egp = total_value_usd * egp_rate

    # Calculate total cost in USD
    total_cost_usd = 0.0
    for inv in enriched:
        if inv.total_cost:
            if inv.purchase_currency == "EGP":
                total_cost_usd += inv.total_cost / egp_rate
            else:
                total_cost_usd += inv.total_cost

    total_pl_usd = total_value_usd - total_cost_usd
    total_pl_pct = (total_pl_usd / total_cost_usd * 100) if total_cost_usd > 0 else 0

    allocation = _compute_allocation(enriched, total_value_usd)

    return PortfolioSummary(
        total_value_usd=round(total_value_usd, 2),
        total_value_egp=round(total_value_egp, 2),
        total_cost_usd=round(total_cost_usd, 2),
        total_profit_loss_usd=round(total_pl_usd, 2),
        total_profit_loss_pct=round(total_pl_pct, 2),
        usd_to_egp_rate=egp_rate,
        investments=enriched,
        allocation=allocation,
    )


def _compute_allocation(enriched, total_value_usd: float) -> list[dict]:
    """Group investments by asset type and compute allocation percentages."""
    groups: dict[str, float] = {}
    for inv in enriched:
        asset_type = inv.asset_type.value
        groups[asset_type] = groups.get(asset_type, 0) + (inv.current_value_usd or 0)

    labels = {
        "gold": "Gold",
        "silver": "Silver",
        "crypto": "Crypto",
        "us_stock": "US Stocks",
        "egx_stock": "EGX Stocks",
    }
    colors = {
        "gold": "#FFD700",
        "silver": "#C0C0C0",
        "crypto": "#F7931A",
        "us_stock": "#4CAF50",
        "egx_stock": "#1976D2",
    }

    allocation = []
    for asset_type, value in groups.items():
        pct = (value / total_value_usd * 100) if total_value_usd > 0 else 0
        allocation.append({
            "asset_type": asset_type,
            "label": labels.get(asset_type, asset_type),
            "value_usd": round(value, 2),
            "percentage": round(pct, 2),
            "color": colors.get(asset_type, "#999999"),
        })

    return sorted(allocation, key=lambda x: x["percentage"], reverse=True)


async def get_allocation(db: AsyncSession) -> list[dict]:
    """Get asset allocation breakdown."""
    investments = await get_investments(db)
    enriched = await enrich_investments(investments)
    total_value = sum(i.current_value_usd or 0 for i in enriched)
    return _compute_allocation(enriched, total_value)


async def take_snapshot(db: AsyncSession) -> PortfolioSnapshot:
    """Take a portfolio value snapshot for historical tracking."""
    investments = await get_investments(db)
    enriched = await enrich_investments(investments)
    egp_rate = await get_usd_to_egp_rate()

    total_usd = sum(i.current_value_usd or 0 for i in enriched)
    total_egp = total_usd * egp_rate

    snapshot = PortfolioSnapshot(
        total_value_usd=round(total_usd, 2),
        total_value_egp=round(total_egp, 2),
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)
    return snapshot


async def get_performance(
    db: AsyncSession, period: str = "30d"
) -> list[PortfolioSnapshotResponse]:
    """Get portfolio snapshots for a given period."""
    period_map = {
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90),
        "1y": timedelta(days=365),
    }

    query = select(PortfolioSnapshot).order_by(PortfolioSnapshot.snapshot_date.asc())

    if period != "all" and period in period_map:
        cutoff = datetime.utcnow() - period_map[period]
        query = query.where(PortfolioSnapshot.snapshot_date >= cutoff)

    result = await db.execute(query)
    snapshots = result.scalars().all()
    return [PortfolioSnapshotResponse.model_validate(s) for s in snapshots]
