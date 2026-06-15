import useSWR from "swr";

export interface OHLCVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOHLCV(symbol: string, interval: string) {
  const { data, error, isLoading } = useSWR<OHLCVCandle[]>(
    `/api/ohlcv?symbol=${symbol}&interval=${interval}&limit=200`,
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    }
  );

  return {
    candles: data ?? [],
    isLoading,
    isError: !!error,
  };
}
