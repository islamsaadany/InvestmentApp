from datetime import datetime
from fastapi import APIRouter, Query
from app.market_data import get_current_price, get_usd_to_egp_rate

router = APIRouter()


@router.get("/price/{asset_type}/{symbol}")
async def get_price(asset_type: str, symbol: str):
    price_usd = await get_current_price(asset_type, symbol)
    egp_rate = await get_usd_to_egp_rate()

    if price_usd is None:
        return {
            "symbol": symbol,
            "asset_type": asset_type,
            "price_usd": None,
            "price_egp": None,
            "error": "Price unavailable",
            "timestamp": datetime.utcnow().isoformat(),
        }

    return {
        "symbol": symbol,
        "asset_type": asset_type,
        "price_usd": round(price_usd, 4),
        "price_egp": round(price_usd * egp_rate, 4),
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/exchange-rate")
async def get_exchange_rate():
    rate = await get_usd_to_egp_rate()
    return {
        "usd_to_egp": rate,
        "last_updated": datetime.utcnow().isoformat(),
    }


@router.get("/prices/batch")
async def get_batch_prices(
    symbols: str = Query(..., description="Comma-separated asset_type:symbol pairs, e.g. crypto:BTC,us_stock:AAPL")
):
    """Fetch prices for multiple assets in one call."""
    results = []
    egp_rate = await get_usd_to_egp_rate()

    pairs = [s.strip() for s in symbols.split(",") if ":" in s]

    for pair in pairs:
        asset_type, symbol = pair.split(":", 1)
        price_usd = await get_current_price(asset_type, symbol)

        results.append({
            "symbol": symbol,
            "asset_type": asset_type,
            "price_usd": round(price_usd, 4) if price_usd else None,
            "price_egp": round(price_usd * egp_rate, 4) if price_usd else None,
        })

    return {
        "prices": results,
        "usd_to_egp": egp_rate,
        "timestamp": datetime.utcnow().isoformat(),
    }
