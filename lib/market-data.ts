// In-memory price cache with TTL
const priceCache: Map<string, { price: number; cachedAt: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const EXCHANGE_RATE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCached(key: string, ttl: number = CACHE_TTL_MS): number | null {
  const entry = priceCache.get(key);
  if (entry && Date.now() - entry.cachedAt < ttl) {
    return entry.price;
  }
  return null;
}

function setCache(key: string, price: number): void {
  priceCache.set(key, { price, cachedAt: Date.now() });
}

// --- Exchange Rate ---

export async function getUsdToEgpRate(): Promise<number> {
  const cached = getCached("USD_EGP", EXCHANGE_RATE_TTL_MS);
  if (cached) return cached;

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const rate = data.rates?.EGP ?? 50.0;
    setCache("USD_EGP", rate);
    return rate;
  } catch {
    return 50.0; // Fallback
  }
}

// --- Crypto (CoinGecko) ---

const COIN_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  SOL: "solana",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
};

export async function getCryptoPrice(symbol: string): Promise<number | null> {
  const cacheKey = `crypto_${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const coinId = COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    const price = data[coinId]?.usd;
    if (price != null) {
      setCache(cacheKey, price);
      return price;
    }
  } catch {
    // Silently fail
  }
  return null;
}

// --- Stocks (Yahoo Finance via public query API) ---

export async function getStockPrice(symbol: string): Promise<number | null> {
  const cacheKey = `stock_${symbol}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    const data = await res.json();
    const meta = data.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (price != null) {
      setCache(cacheKey, price);
      return price;
    }
  } catch {
    // Silently fail
  }
  return null;
}

// --- Metals (Gold/Silver via Yahoo Finance futures) ---

export async function getMetalPrice(metal: "gold" | "silver"): Promise<number | null> {
  const cacheKey = `metal_${metal}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const symbol = metal === "gold" ? "GC=F" : "SI=F";
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    const data = await res.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price != null) {
      setCache(cacheKey, price);
      return price;
    }
  } catch {
    // Silently fail
  }
  return null;
}

// --- Unified Price Fetcher ---

export async function getCurrentPrice(
  assetType: string,
  symbol: string
): Promise<number | null> {
  switch (assetType) {
    case "crypto":
      return getCryptoPrice(symbol);
    case "gold":
      return getMetalPrice("gold");
    case "silver":
      return getMetalPrice("silver");
    case "us_stock":
    case "egx_stock":
      return getStockPrice(symbol);
    default:
      return null;
  }
}

// --- Constants ---

export const GRAMS_PER_TROY_OUNCE = 31.1035;
