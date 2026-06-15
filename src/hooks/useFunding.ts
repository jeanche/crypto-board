import useSWR from "swr";

export interface FundingRate {
  time: number;
  rate: number;
  markPrice: number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFunding(symbol: string) {
  const { data, error, isLoading } = useSWR<FundingRate[]>(
    `/api/funding?symbol=${symbol}&limit=10`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    }
  );

  const rates = data ?? [];
  const current = rates.length > 0 ? rates[rates.length - 1].rate : 0;

  return {
    rates,
    currentRate: current,
    isLoading,
    isError: !!error,
  };
}
