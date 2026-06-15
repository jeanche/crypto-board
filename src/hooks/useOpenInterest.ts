import useSWR from "swr";

export interface OpenInterestData {
  openInterest: {
    symbol: string;
    openInterest: number;
    time: number;
  };
  longShortRatio: Array<{
    symbol: string;
    ratio: number;
    longAccount: number;
    shortAccount: number;
    timestamp: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOpenInterest(symbol: string) {
  const { data, error, isLoading } = useSWR<OpenInterestData>(
    `/api/openinterest?symbol=${symbol}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    }
  );

  const lsRatios = data?.longShortRatio ?? [];
  const latestLSRatio = lsRatios.length > 0 ? lsRatios[lsRatios.length - 1] : null;

  return {
    openInterest: data?.openInterest ?? null,
    longShortRatio: lsRatios,
    latestLongRatio: latestLSRatio?.longAccount ?? 0.5,
    latestShortRatio: latestLSRatio?.shortAccount ?? 0.5,
    isLoading,
    isError: !!error,
  };
}
