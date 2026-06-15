"use client";

import { useOpenInterest } from "@/hooks/useOpenInterest";
import { Users } from "lucide-react";

interface LongShortRatioProps {
  symbol: string;
}

export default function LongShortRatio({ symbol }: LongShortRatioProps) {
  const { latestLongRatio, latestShortRatio, longShortRatio, isLoading } =
    useOpenInterest(symbol);

  const longPct = latestLongRatio * 100;
  const shortPct = latestShortRatio * 100;

  let sentiment = "";
  let sentimentColor = "var(--text-secondary)";
  if (latestLongRatio > 0.65) {
    sentiment = "Signal BEARISH — Surexposition haussière";
    sentimentColor = "var(--red)";
  } else if (latestLongRatio < 0.35) {
    sentiment = "Signal BULLISH — Surexposition baissière";
    sentimentColor = "var(--green)";
  } else if (latestLongRatio > 0.55) {
    sentiment = "Légère surexposition long";
    sentimentColor = "#e3b341";
  } else {
    sentiment = "Ratio équilibré";
    sentimentColor = "var(--text-secondary)";
  }

  // Build sparkline from history
  const history = longShortRatio.slice(-20);

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
        <Users size={13} />
        RATIO LONGS / SHORTS
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement...</div>
      ) : (
        <>
          {/* Progress Bar */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                height: 20,
                borderRadius: 4,
                overflow: "hidden",
                display: "flex",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: `${longPct}%`,
                  background: "var(--green)",
                  transition: "width 0.5s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {longPct > 20 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#0d1117" }}>
                    {longPct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div
                style={{
                  width: `${shortPct}%`,
                  background: "var(--red)",
                  transition: "width 0.5s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {shortPct > 20 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    {shortPct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "var(--green)" }}>
                LONG {longPct.toFixed(1)}%
              </span>
              <span style={{ color: "var(--red)" }}>
                SHORT {shortPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Sentiment label */}
          <div
            style={{
              fontSize: 11,
              color: sentimentColor,
              padding: "5px 8px",
              borderRadius: 4,
              background: sentimentColor + "18",
              border: `1px solid ${sentimentColor}40`,
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            {sentiment}
          </div>

          {/* Mini historical sparkline */}
          {history.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  letterSpacing: "0.05em",
                }}
              >
                HISTORIQUE % LONGS
              </div>
              <svg
                width="100%"
                height="36"
                viewBox={`0 0 ${history.length * 10} 36`}
                preserveAspectRatio="none"
                style={{ display: "block" }}
              >
                <polyline
                  points={history
                    .map((item, i) => {
                      const x = i * 10 + 5;
                      const y = 36 - item.longAccount * 36;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* 50% line */}
                <line
                  x1="0"
                  y1="18"
                  x2={history.length * 10}
                  y2="18"
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                {/* 65% warning line */}
                <line
                  x1="0"
                  y1={36 - 0.65 * 36}
                  x2={history.length * 10}
                  y2={36 - 0.65 * 36}
                  stroke="var(--red)"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
                {/* 35% warning line */}
                <line
                  x1="0"
                  y1={36 - 0.35 * 36}
                  x2={history.length * 10}
                  y2={36 - 0.35 * 36}
                  stroke="var(--green)"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
}
