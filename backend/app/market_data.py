import httpx
import yfinance as yf
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Optional

# Simple in-memory cache with TTL
_price_cache: dict[str, tuple[float, datetime]] = {}
CACHE_TTL = timedelta(minutes=5)


def _get_cached(key: str) -> Optional[float]:
    if key in _price_cache:
        price, cached_at = _price_cache[key]
        if datetime.now() - cached_at < CACHE_TTL:
            return price
    return None


def _set_cache(key: str, price: float):
    _price_cache[key] = (price, datetime.now())


async def get_usd_to_egp_rate() -> float:
    """Get current USD to EGP exchange rate."""
    cached = _get_cached("USD_EGP")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.exchangerate-api.com/v4/latest/USD"
            )
            data = resp.json()
            rate = data["rates"].get("EGP", 50.0)
            _set_cache("USD_EGP", rate)
            return rate
    except Exception:
        return 50.0  # Fallback rate


async def get_crypto_price(symbol: str) -> Optional[float]:
    """Get crypto price in USD from CoinGecko."""
    cache_key = f"crypto_{symbol}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    # Map common symbols to CoinGecko IDs
    symbol_map = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "USDT": "tether",
        "USDC": "usd-coin",
        "BNB": "binancecoin",
        "XRP": "ripple",
        "ADA": "cardano",
        "SOL": "solana",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "MATIC": "matic-network",
        "AVAX": "avalanche-2",
        "LINK": "chainlink",
        "UNI": "uniswap",
        "ATOM": "cosmos",
        "LTC": "litecoin",
    }

    coin_id = symbol_map.get(symbol.upper(), symbol.lower())

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.coingecko.com/api/v3/simple/price",
                params={"ids": coin_id, "vs_currencies": "usd"},
            )
            data = resp.json()
            if coin_id in data and "usd" in data[coin_id]:
                price = data[coin_id]["usd"]
                _set_cache(cache_key, price)
                return price
    except Exception:
        pass
    return None


async def get_stock_price(symbol: str) -> Optional[float]:
    """Get stock price using yfinance."""
    cache_key = f"stock_{symbol}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        price = info.get("lastPrice") or info.get("last_price")
        if price:
            _set_cache(cache_key, float(price))
            return float(price)
    except Exception:
        pass
    return None


async def get_metal_price(metal: str) -> Optional[float]:
    """Get gold/silver price per troy ounce in USD."""
    cache_key = f"metal_{metal}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        # Use the free metals price from a public API
        symbol = "XAUUSD" if metal == "gold" else "XAGUSD"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"https://api.metalpriceapi.com/v1/latest?api_key=demo&base=USD&currencies={symbol[:3]}"
            )
            data = resp.json()
            if data.get("success") and "rates" in data:
                rate = data["rates"].get(symbol[:3])
                if rate:
                    price = 1.0 / rate  # Convert to price per ounce
                    _set_cache(cache_key, price)
                    return price
    except Exception:
        pass

    # Fallback: use yfinance for metals
    try:
        yf_symbol = "GC=F" if metal == "gold" else "SI=F"
        ticker = yf.Ticker(yf_symbol)
        info = ticker.fast_info
        price = info.get("lastPrice") or info.get("last_price")
        if price:
            _set_cache(cache_key, float(price))
            return float(price)
    except Exception:
        pass

    return None


# Troy ounce conversion
GRAMS_PER_TROY_OUNCE = 31.1035


def grams_to_troy_ounces(grams: float) -> float:
    return grams / GRAMS_PER_TROY_OUNCE


def troy_ounces_to_grams(ounces: float) -> float:
    return ounces * GRAMS_PER_TROY_OUNCE


async def get_current_price(asset_type: str, symbol: str) -> Optional[float]:
    """Get current price for any asset type. Returns price in USD."""
    if asset_type == "crypto":
        return await get_crypto_price(symbol)
    elif asset_type == "gold":
        return await get_metal_price("gold")
    elif asset_type == "silver":
        return await get_metal_price("silver")
    elif asset_type in ("us_stock", "egx_stock"):
        return await get_stock_price(symbol)
    return None
