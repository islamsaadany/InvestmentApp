from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models import PriceAlert, AssetType
from app.schemas import PriceAlertCreate, PriceAlertResponse
from app.market_data import get_current_price, get_usd_to_egp_rate


async def create_alert(db: AsyncSession, data: PriceAlertCreate) -> PriceAlert:
    alert = PriceAlert(**data.model_dump())
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def get_alerts(
    db: AsyncSession,
    is_active: bool | None = None,
    is_triggered: bool | None = None,
) -> list[PriceAlert]:
    query = select(PriceAlert).order_by(PriceAlert.created_at.desc())
    if is_active is not None:
        query = query.where(PriceAlert.is_active == is_active)
    if is_triggered is not None:
        query = query.where(PriceAlert.is_triggered == is_triggered)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_alert(db: AsyncSession, alert_id: int) -> PriceAlert:
    result = await db.execute(
        select(PriceAlert).where(PriceAlert.id == alert_id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


async def delete_alert(db: AsyncSession, alert_id: int) -> None:
    alert = await get_alert(db, alert_id)
    await db.delete(alert)
    await db.commit()


async def deactivate_alert(db: AsyncSession, alert_id: int) -> PriceAlert:
    alert = await get_alert(db, alert_id)
    alert.is_active = False
    await db.commit()
    await db.refresh(alert)
    return alert


async def enrich_alert(alert: PriceAlert) -> PriceAlertResponse:
    """Add current price to alert response."""
    current_price = await get_current_price(alert.asset_type.value, alert.symbol)
    response = PriceAlertResponse.model_validate(alert)
    response.current_price = current_price
    return response


async def check_alerts(db: AsyncSession) -> list[PriceAlert]:
    """Check all active alerts against current prices. Returns newly triggered alerts."""
    active_alerts = await get_alerts(db, is_active=True, is_triggered=False)
    if not active_alerts:
        return []

    egp_rate = await get_usd_to_egp_rate()
    triggered = []

    for alert in active_alerts:
        price_usd = await get_current_price(alert.asset_type.value, alert.symbol)
        if price_usd is None:
            continue

        # Convert price to alert's currency for comparison
        if alert.currency == "EGP":
            current_price = price_usd * egp_rate
        else:
            current_price = price_usd

        # Check condition
        is_triggered = False
        if alert.condition == "above" and current_price >= alert.target_price:
            is_triggered = True
        elif alert.condition == "below" and current_price <= alert.target_price:
            is_triggered = True

        if is_triggered:
            alert.is_triggered = True
            triggered.append(alert)

    if triggered:
        await db.commit()

    return triggered
