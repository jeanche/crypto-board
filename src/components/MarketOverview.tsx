"use client";

import useSWR from "swr";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatChange, formatVolume } from "@/lib/utils";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  image: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function CoinCard({ coin }: { coin: CoinData }) {
  const isPositive = coin.change24h >= 0;

  return (
    <div
      className="card slide-in"
      style={{
        padding: "14px 18px",
        flex: 1,
        minWidth: 180,
        transition: "border-color 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isPositive
          ? "var(--green)"
          : "var(--red)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coin.image}
            alt={coin.symbol}
            width={22}
            height={22}
            style={{ borderRadius: "50%" }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--text-primary)",
            }}
          >
            {coin.symbol}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{coin.name}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: isPositive ? "var(--green)" : "var(--red)",
          }}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{formatChange(coin.change24h)}</span>
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>
        ${formatPrice(coin.price)}
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 12 }}>
        <span>VOL {formatVolume(coin.volume24h)}</span>
        <span>CAP {formatVolume(coin.marketCap)}</span>
      </div>
    </div>
  );
}

export default function MarketOverview() {
  const { data, isLoading, error } = useSWR<CoinData[]>("/api/market", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              flex: 1,
              minWidth: 180,
              height: 90,
              background:
                "linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="card"
        style={{ padding: 16, color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}
      >
        Market data unavailable
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {data.map((coin) => (
        <CoinCard key={coin.id} coin={coin} />
      ))}
    </div>
  );
}
