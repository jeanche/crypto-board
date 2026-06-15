"use client";

import { useOpenInterest } from "@/hooks/useOpenInterest";
import { formatVolume } from "@/lib/utils";
import { BarChart2 } from "lucide-react";

interface OpenInterestPanelProps {
  symbol: string;
}

export default function OpenInterestPanel({ symbol }: OpenInterestPanelProps) {
  const { openInterest, longShortRatio, isLoading } = useOpenInterest(symbol);

  // Calculate OI in USD (OI * mark price roughly)
  const oiValue = openInterest?.openInterest ?? 0;

  // Get OI history from long/short ratios timestamps for mini-chart
  const lsHistory = longShortRatio.slice(-12);

  return (
    <div className="card" style={{ padding: 16, height: "100%" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          marginBottom: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <BarChart2 size={13} />
        OPEN INTEREST
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement...</div>
      ) : (
        <>
          {/* Main OI value */}
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--blue)",
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              {oiValue > 0
                ? `${oiValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} BTC`
                : "—"}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Contrats ouverts en {symbol.replace("USDT", "")}
            </div>
          </div>

          {/* Long/Short ratio mini-bar trend */}
          {lsHistory.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  letterSpacing: "0.05em",
                }}
              >
                RATIO L/S (24h)
              </div>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 40 }}>
                {lsHistory.map((item, i) => {
                  const longPct = item.longAccount;
                  const height = Math.max(4, Math.round(longPct * 38));
                  const color =
                    longPct > 0.65
                      ? "var(--red)"
                      : longPct < 0.35
                      ? "var(--green)"
                      : "var(--blue)";
                  return (
                    <div
                      key={item.timestamp}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height,
                          borderRadius: 2,
                          background: color,
                          opacity: 0.4 + (i / lsHistory.length) * 0.6,
                        }}
                        title={`Longs: ${(item.longAccount * 100).toFixed(1)}%`}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ height: 1, background: "var(--border)", marginTop: 2 }} />

              {/* Current ratio text */}
              {lsHistory.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--green)" }}>
                    L: {(lsHistory[lsHistory.length - 1].longAccount * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: "var(--red)" }}>
                    S: {(lsHistory[lsHistory.length - 1].shortAccount * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
