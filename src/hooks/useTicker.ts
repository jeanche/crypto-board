import useSWR from "swr";

export interface TickerItem {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  lastPrice: number;
  quoteVolume: number;
  volume: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTicker() {
  const { data, error, isLoading } = useSWR<TickerItem[]>(
    `/api/ticker`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    }
  );

  return {
    tickers: data ?? [],
    isLoading,
    isError: !!error,
  };
}
