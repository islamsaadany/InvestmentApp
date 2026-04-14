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
  MNT: "mantle",
};

export async function getCryptoPriceBatch(symbols: string[]): Promise<void> {
  // Resolve all symbols to CoinGecko IDs, skip already-cached ones
  const uncached: { symbol: string; coinId: string }[] = [];
  for (const symbol of symbols) {
    const cacheKey = `crypto_${symbol}`;
    if (getCached(cacheKey) != null) continue;
    const coinId = COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
    uncached.push({ symbol, coinId });
  }

  if (uncached.length === 0) return;

  const coinIds = [...new Set(uncached.map((u) => u.coinId))];
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(10000) }
    );
    const data = await res.json();
    for (const { symbol, coinId } of uncached) {
      const price = data[coinId]?.usd;
      if (price != null) {
        setCache(`crypto_${symbol}`, price);
      }
    }
  } catch {
    // Silently fail — individual calls will retry
  }
}

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

// --- Historical Price Fetching ---

/**
 * Fetch historical daily prices from Yahoo Finance (stocks, metals).
 * Returns array of { date: "YYYY-MM-DD", price: number }
 */
export async function getYahooHistoricalPrices(
  symbol: string,
  fromDate: Date,
  toDate: Date
): Promise<{ date: string; price: number }[]> {
  const period1 = Math.floor(fromDate.getTime() / 1000);
  const period2 = Math.floor(toDate.getTime() / 1000);

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`,
      {
        signal: AbortSignal.timeout(30000),
        headers: { "User-Agent": "Mozilla/5.0" },
      }
    );
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] =
      result.indicators?.quote?.[0]?.close || [];

    const prices: { date: string; price: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close != null) {
        const d = new Date(timestamps[i] * 1000);
        const dateStr = d.toISOString().split("T")[0];
        prices.push({ date: dateStr, price: close });
      }
    }
    return prices;
  } catch (err) {
    console.error(`Yahoo historical fetch failed for ${symbol}:`, err);
    return [];
  }
}

// Reverse map: CoinGecko ID → Yahoo Finance ticker
const COIN_YAHOO_MAP: Record<string, string> = {};
for (const [ticker, coinId] of Object.entries(COIN_ID_MAP)) {
  COIN_YAHOO_MAP[coinId] = ticker;
}

/**
 * Fetch historical daily prices from CoinGecko (crypto).
 * Tries Yahoo Finance first with proper symbol mapping.
 * Returns array of { date: "YYYY-MM-DD", price: number }
 */
export async function getCoinGeckoHistoricalPrices(
  symbol: string,
  fromDate: Date,
  toDate: Date
): Promise<{ date: string; price: number }[]> {
  // Resolve to Yahoo ticker: if symbol is a CoinGecko ID (e.g., "solana"),
  // map it to the Yahoo ticker (e.g., "SOL")
  const yahooTicker =
    COIN_YAHOO_MAP[symbol.toLowerCase()] || // "solana" → "SOL"
    COIN_ID_MAP[symbol.toUpperCase()]       // "SOL" → already a ticker
      ? symbol.toUpperCase()
      : symbol.toUpperCase();

  const yahooSymbol = `${yahooTicker}-USD`;
  const yahooResult = await getYahooHistoricalPrices(yahooSymbol, fromDate, toDate);
  if (yahooResult.length > 0) return yahooResult;

  // Fallback to CoinGecko
  const coinId = COIN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
  const from = Math.floor(fromDate.getTime() / 1000);
  const to = Math.floor(toDate.getTime() / 1000);

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`,
      { signal: AbortSignal.timeout(30000) }
    );
    const data = await res.json();
    const rawPrices: [number, number][] = data.prices || [];

    // CoinGecko returns multiple data points per day — deduplicate to one per day
    const dailyMap = new Map<string, number>();
    for (const [timestamp, price] of rawPrices) {
      const dateStr = new Date(timestamp).toISOString().split("T")[0];
      dailyMap.set(dateStr, price); // Last value for each day wins
    }

    return Array.from(dailyMap.entries())
      .map(([date, price]) => ({ date, price }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error(`CoinGecko historical fetch failed for ${symbol}:`, err);
    return [];
  }
}

/**
 * Unified historical price fetcher.
 */
export async function getHistoricalPrices(
  assetType: string,
  symbol: string,
  fromDate: Date,
  toDate: Date
): Promise<{ date: string; price: number }[]> {
  switch (assetType) {
    case "crypto": {
      // Map CoinGecko IDs (solana, ripple) back to Yahoo tickers (SOL, XRP)
      const yahooTicker =
        COIN_YAHOO_MAP[symbol.toLowerCase()] ||
        (COIN_ID_MAP[symbol.toUpperCase()] ? symbol.toUpperCase() : symbol.toUpperCase());
      const yahooResult = await getYahooHistoricalPrices(`${yahooTicker}-USD`, fromDate, toDate);
      if (yahooResult.length > 0) return yahooResult;
      // Fallback to CoinGecko only if Yahoo fails
      return getCoinGeckoHistoricalPrices(symbol, fromDate, toDate);
    }
    case "gold":
      return getYahooHistoricalPrices("GC=F", fromDate, toDate);
    case "silver":
      return getYahooHistoricalPrices("SI=F", fromDate, toDate);
    case "us_stock":
    case "egx_stock":
      return getYahooHistoricalPrices(symbol, fromDate, toDate);
    default:
      return [];
  }
}

// --- Constants ---

export const GRAMS_PER_TROY_OUNCE = 31.1035;
