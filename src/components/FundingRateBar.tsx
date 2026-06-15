"use client";

import { useFunding } from "@/hooks/useFunding";
import { formatFundingRate, formatDate } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FundingRateBarProps {
  symbol: string;
}

export default function FundingRateBar({ symbol }: FundingRateBarProps) {
  const { rates, currentRate, isLoading } = useFunding(symbol);

  const isHighPositive = currentRate > 0.001;
  const isLowPositive = currentRate > 0.0003;
  const isHighNegative = currentRate < -0.0005;
  const isLowNegative = currentRate < -0.0001;

  let rateColor = "var(--text-secondary)";
  let interpretation = "Marché équilibré";
  let InterpIcon = Minus;

  if (isHighPositive) {
    rateColor = "var(--red)";
    interpretation = "Marché suracheté — Longs en excès";
    InterpIcon = AlertTriangle;
  } else if (isLowPositive) {
    rateColor = "#e3b341";
    interpretation = "Légère pression haussière";
    InterpIcon = TrendingUp;
  } else if (isHighNegative) {
    rateColor = "var(--green)";
    interpretation = "Marché survendu — Shorts en excès";
    InterpIcon = AlertTriangle;
  } else if (isLowNegative) {
    rateColor = "#58a6ff";
    interpretation = "Légère pression baissière";
    InterpIcon = TrendingDown;
  }

  // Find max absolute value for bar scaling
  const maxAbs = Math.max(...rates.map((r) => Math.abs(r.rate)), 0.001);

  return (
    <div className="card" style={{ padding: "16px", height: "100%" }}>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        TAUX DE FINANCEMENT
      </div>

      {isLoading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement...</div>
      ) : (
        <>
          {/* Current Rate */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: rateColor,
                letterSpacing: "-0.02em",
              }}
            >
              {formatFundingRate(currentRate)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                lineHeight: 1.3,
              }}
            >
              / 8h
            </span>
          </div>

          {/* Interpretation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
              padding: "6px 10px",
              borderRadius: 5,
              background: rateColor + "18",
              border: `1px solid ${rateColor}40`,
            }}
          >
            <InterpIcon size={13} color={rateColor} />
            <span style={{ fontSize: 12, color: rateColor, fontWeight: 500 }}>
              {interpretation}
            </span>
          </div>

          {/* History bars */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              HISTORIQUE (10 dernières périodes)
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
              {rates.map((r, i) => {
                const normalized = Math.abs(r.rate) / maxAbs;
                const height = Math.max(4, Math.round(normalized * 48));
                const barColor = r.rate > 0 ? "var(--red)" : "var(--green)";
                const isLast = i === rates.length - 1;

                return (
                  <div
                    key={r.time}
                    title={`${formatDate(r.time)}: ${formatFundingRate(r.rate)}`}
                    style={{
                      flex: 1,
                      height,
                      borderRadius: 2,
                      background: barColor,
                      opacity: isLast ? 1 : 0.5 + (i / rates.length) * 0.5,
                      border: isLast ? `1px solid ${barColor}` : "none",
                      cursor: "default",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = isLast
                        ? "1"
                        : String(0.5 + (i / rates.length) * 0.5);
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                height: 1,
                background: "var(--border)",
                marginTop: 2,
              }}
            />
          </div>

          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)" }}>
            <span style={{ color: "var(--green)" }}>▪ Négatif (shorts paient)</span>
            <span style={{ color: "var(--red)" }}>▪ Positif (longs paient)</span>
          </div>
        </>
      )}
    </div>
  );
}
