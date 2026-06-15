"use client";

import { useTicker } from "@/hooks/useTicker";
import useSWR from "swr";
import { formatVolume, formatFundingRate } from "@/lib/utils";
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FuturesTableProps {
  onSymbolSelect: (symbol: string) => void;
  activeSymbol: string;
}

interface FundingMap {
  [symbol: string]: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getFundingSignal(rate: number): { dir: string; color: string; icon: React.ReactNode } {
  if (rate > 0.001) return { dir: "SHORT", color: "var(--red)", icon: <TrendingDown size={12} /> };
  if (rate < -0.0005) return { dir: "LONG", color: "var(--green)", icon: <TrendingUp size={12} /> };
  return { dir: "NEUTRAL", color: "var(--text-muted)", icon: <Minus size={12} /> };
}

export default function FuturesTable({ onSymbolSelect, activeSymbol }: FuturesTableProps) {
  const { tickers, isLoading } = useTicker();

  // Fetch funding for all symbols in the table
  const symbols = tickers.map((t) => t.symbol);
  const { data: fundingBatch } = useSWR<FundingMap>(
    symbols.length > 0 ? `/api/funding?symbol=${symbols[0]}&limit=1` : null,
    fetcher,
    { refreshInterval: 60_000 }
  );

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>SCREENER FUTURES — TOP 20 PAR VOLUME</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
          Actualisation auto toutes les 30s
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border)",
                background: "#0d1117",
              }}
            >
              {["#", "SYMBOLE", "PRIX", "24H CHANGE", "VOLUME 24H", "TAUX FR", "SIGNAL"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      padding: "8px 14px",
                      textAlign: col === "#" || col === "SYMBOLE" ? "left" : "right",
                      color: "var(--text-muted)",
                      fontSize: 10,
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: "10px 14px" }}>
                      <div
                        style={{
                          height: 12,
                          borderRadius: 3,
                          background: "var(--bg-card-hover)",
                          width: `${40 + Math.random() * 60}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              tickers.map((ticker, i) => {
                const isPositive = ticker.priceChangePercent >= 0;
                const isActive = ticker.symbol === activeSymbol;
                // We only have funding for the main symbol in this demo
                // In a real app you'd batch-fetch all funding rates
                const fundingRate =
                  ticker.symbol === activeSymbol ? (fundingBatch as unknown as number) ?? 0 : 0;
                const { dir, color, icon } = getFundingSignal(fundingRate);

                return (
                  <tr
                    key={ticker.symbol}
                    onClick={() => onSymbolSelect(ticker.symbol)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background: isActive ? "var(--blue)15" : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = isActive
                        ? "var(--blue)15"
                        : "transparent";
                    }}
                  >
                    {/* Rank */}
                    <td
                      style={{
                        padding: "9px 14px",
                        color: "var(--text-muted)",
                        fontSize: 11,
                      }}
                    >
                      {i + 1}
                    </td>

                    {/* Symbol */}
                    <td style={{ padding: "9px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isActive && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "var(--blue)",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontWeight: 600,
                            color: isActive ? "var(--blue)" : "var(--text-primary)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {ticker.symbol.replace("USDT", "")}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>PERP</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td
                      style={{
                        padding: "9px 14px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 500,
                      }}
                    >
                      ${ticker.lastPrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: ticker.lastPrice > 100 ? 2 : 4,
                      })}
                    </td>

                    {/* 24h Change */}
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          color: isPositive ? "var(--green)" : "var(--red)",
                          fontWeight: 600,
                        }}
                      >
                        {isPositive ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {Math.abs(ticker.priceChangePercent).toFixed(2)}%
                      </div>
                    </td>

                    {/* Volume */}
                    <td
                      style={{
                        padding: "9px 14px",
                        textAlign: "right",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {formatVolume(ticker.quoteVolume)}
                    </td>

                    {/* Funding Rate */}
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
                      {ticker.symbol === activeSymbol && fundingRate !== 0 ? (
                        <span
                          style={{
                            color: fundingRate > 0 ? "var(--red)" : "var(--green)",
                            fontFamily: "monospace",
                            fontSize: 11,
                          }}
                        >
                          {formatFundingRate(fundingRate)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>—</span>
                      )}
                    </td>

                    {/* Signal */}
                    <td style={{ padding: "9px 14px", textAlign: "right" }}>
                      {ticker.symbol === activeSymbol ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 3,
                            background: color + "20",
                          }}
                        >
                          {icon}
                          {dir}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 10 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
