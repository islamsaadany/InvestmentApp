import api from './client';

export async function fetchExchangeRate(): Promise<{ usd_to_egp: number; last_updated: string }> {
  const { data } = await api.get('/api/market/exchange-rate');
  return data;
}

export async function fetchPrice(assetType: string, symbol: string) {
  const { data } = await api.get(`/api/market/price/${assetType}/${symbol}`);
  return data;
}
