import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models import Investment, AssetType, WeightUnit
from app.schemas import InvestmentCreate, InvestmentUpdate, InvestmentResponse
from app.market_data import (
    get_current_price,
    get_usd_to_egp_rate,
    GRAMS_PER_TROY_OUNCE,
)


async def create_investment(db: AsyncSession, data: InvestmentCreate) -> Investment:
    investment = Investment(**data.model_dump())
    db.add(investment)
    await db.commit()
    await db.refresh(investment)
    return investment


async def get_investments(
    db: AsyncSession,
    asset_type: AssetType | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Investment]:
    query = select(Investment)
    if asset_type:
        query = query.where(Investment.asset_type == asset_type)
    query = query.offset(skip).limit(limit).order_by(Investment.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_investment(db: AsyncSession, investment_id: int) -> Investment:
    result = await db.execute(
        select(Investment).where(Investment.id == investment_id)
    )
    investment = result.scalar_one_or_none()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment


async def update_investment(
    db: AsyncSession, investment_id: int, data: InvestmentUpdate
) -> Investment:
    investment = await get_investment(db, investment_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(investment, field, value)
    await db.commit()
    await db.refresh(investment)
    return investment


async def delete_investment(db: AsyncSession, investment_id: int) -> None:
    investment = await get_investment(db, investment_id)
    await db.delete(investment)
    await db.commit()


async def enrich_with_live_data(investment: Investment) -> InvestmentResponse:
    """Enrich an investment with live market data and P&L calculations."""
    current_price, egp_rate = await asyncio.gather(
        get_current_price(investment.asset_type.value, investment.symbol),
        get_usd_to_egp_rate(),
    )

    response = InvestmentResponse.model_validate(investment)

    if current_price is None:
        return response

    response.current_price = current_price

    # Calculate current value in USD
    quantity = investment.quantity
    if investment.asset_type in (AssetType.GOLD, AssetType.SILVER):
        if investment.weight_unit == WeightUnit.GRAMS:
            # Convert grams to troy ounces for value calculation
            quantity_oz = quantity / GRAMS_PER_TROY_OUNCE
            response.current_value_usd = current_price * quantity_oz
        else:
            response.current_value_usd = current_price * quantity
    else:
        response.current_value_usd = current_price * quantity

    # EGP value
    response.current_value_egp = response.current_value_usd * egp_rate

    # Total cost
    total_cost = investment.purchase_price * investment.quantity
    response.total_cost = total_cost

    # Convert cost to USD if purchased in EGP
    if investment.purchase_currency == "EGP":
        total_cost_usd = total_cost / egp_rate
    else:
        total_cost_usd = total_cost

    # P&L
    if total_cost_usd > 0:
        response.profit_loss = response.current_value_usd - total_cost_usd
        response.profit_loss_pct = (response.profit_loss / total_cost_usd) * 100

    return response


async def enrich_investments(investments: list[Investment]) -> list[InvestmentResponse]:
    """Enrich multiple investments in parallel."""
    tasks = [enrich_with_live_data(inv) for inv in investments]
    return await asyncio.gather(*tasks)
