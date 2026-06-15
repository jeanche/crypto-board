"use client";

import useSWR from "swr";
import { formatPrice } from "@/lib/utils";
import { BookOpen } from "lucide-react";

interface OrderbookData {
  bids: Array<{ price: number; qty: number }>;
  asks: Array<{ price: number; qty: number }>;
  lastUpdateId: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OrderbookPanelProps {
  symbol: string;
}

export default function OrderbookPanel({ symbol }: OrderbookPanelProps) {
  const { data, isLoading } = useSWR<OrderbookData>(
    `/api/orderbook?symbol=${symbol}&limit=20`,
    fetcher,
    {
      refreshInterval: 5_000,
      revalidateOnFocus: false,
    }
  );

  const bids = data?.bids?.slice(0, 10) ?? [];
  const asks = data?.asks?.slice(0, 10) ?? [];

  // Calculate max qty for bar scaling
  const allQty = [...bids, ...asks].map((o) => o.qty);
  const maxQty = allQty.length > 0 ? Math.max(...allQty) : 1;

  // Average qty for wall detection
  const avgQty = allQty.length > 0 ? allQty.reduce((a, b) => a + b, 0) / allQty.length : 1;
  const wallThreshold = avgQty * 2;

  // Spread
  const spread =
    asks.length > 0 && bids.length > 0
      ? ((asks[0].price - bids[0].price) / bids[0].price) * 100
      : null;

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
        <BookOpen size={13} />
        CARNET D&apos;ORDRES
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement...</div>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 80px",
              fontSize: 10,
              color: "var(--text-muted)",
              marginBottom: 4,
              paddingBottom: 4,
              borderBottom: "1px solid var(--border)",
              letterSpacing: "0.05em",
            }}
          >
            <span>PRIX</span>
            <span style={{ textAlign: "right" }}>QTÉ</span>
            <span style={{ textAlign: "right" }}>PROFONDEUR</span>
          </div>

          {/* Asks (reversed, highest first) */}
          <div style={{ marginBottom: 0 }}>
            {[...asks].reverse().map((ask, i) => {
              const isWall = ask.qty > wallThreshold;
              const barWidth = (ask.qty / maxQty) * 100;
              return (
                <div
                  key={`ask-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 80px",
                    fontSize: 11,
                    padding: "2px 0",
                    position: "relative",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "var(--red)",
                      fontWeight: isWall ? 700 : 400,
                    }}
                  >
                    {formatPrice(ask.price)}
                    {isWall && (
                      <span
                        style={{
                          fontSize: 9,
                          marginLeft: 4,
                          color: "var(--red)",
                          background: "var(--red)20",
                          padding: "1px 3px",
                          borderRadius: 2,
                        }}
                      >
                        WALL
                      </span>
                    )}
                  </span>
                  <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                    {ask.qty.toFixed(3)}
                  </span>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <div
                      style={{
                        height: 8,
                        width: `${barWidth}%`,
                        background: `var(--red)${isWall ? "cc" : "60"}`,
                        borderRadius: 1,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spread */}
          {spread !== null && (
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--text-muted)",
                padding: "5px 0",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                margin: "3px 0",
              }}
            >
              Spread:{" "}
              <span style={{ color: "var(--yellow)" }}>
                {spread.toFixed(4)}%
              </span>
            </div>
          )}

          {/* Bids */}
          <div>
            {bids.map((bid, i) => {
              const isWall = bid.qty > wallThreshold;
              const barWidth = (bid.qty / maxQty) * 100;
              return (
                <div
                  key={`bid-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 80px",
                    fontSize: 11,
                    padding: "2px 0",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "var(--green)",
                      fontWeight: isWall ? 700 : 400,
                    }}
                  >
                    {formatPrice(bid.price)}
                    {isWall && (
                      <span
                        style={{
                          fontSize: 9,
                          marginLeft: 4,
                          color: "var(--green)",
                          background: "var(--green)20",
                          padding: "1px 3px",
                          borderRadius: 2,
                        }}
                      >
                        WALL
                      </span>
                    )}
                  </span>
                  <span style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                    {bid.qty.toFixed(3)}
                  </span>
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <div
                      style={{
                        height: 8,
                        width: `${barWidth}%`,
                        background: `var(--green)${isWall ? "cc" : "60"}`,
                        borderRadius: 1,
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
