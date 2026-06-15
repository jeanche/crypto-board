"use client";

import { useOHLCV } from "@/hooks/useOHLCV";
import { useFunding } from "@/hooks/useFunding";
import { useOpenInterest } from "@/hooks/useOpenInterest";
import { generateSignals, SignalDirection } from "@/lib/signals";
import { TrendingUp, TrendingDown, Minus, Target, Shield, DollarSign, CheckCircle, XCircle, Info } from "lucide-react";
import { useMemo } from "react";

interface SignalPanelProps {
  symbol: string;
  timeframe: string;
}

function DirectionBadge({ direction }: { direction: SignalDirection }) {
  const config = {
    LONG: {
      bg: "var(--green)",
      color: "#0d1117",
      icon: <TrendingUp size={16} strokeWidth={2.5} />,
      label: "LONG",
    },
    SHORT: {
      bg: "var(--red)",
      color: "#fff",
      icon: <TrendingDown size={16} strokeWidth={2.5} />,
      label: "SHORT",
    },
    NEUTRAL: {
      bg: "var(--text-muted)",
      color: "#0d1117",
      icon: <Minus size={16} strokeWidth={2.5} />,
      label: "NEUTRE",
    },
  };
  const { bg, color, icon, label } = config[direction];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: bg,
        color,
        borderRadius: 6,
        padding: "8px 18px",
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: "0.08em",
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function SubSignalBadge({
  label,
  direction,
}: {
  label: string;
  direction: SignalDirection | null;
}) {
  if (!direction) return null;
  const colors: Record<SignalDirection, string> = {
    LONG: "var(--green)",
    SHORT: "var(--red)",
    NEUTRAL: "var(--text-muted)",
  };
  const icons: Record<SignalDirection, React.ReactNode> = {
    LONG: <CheckCircle size={11} />,
    SHORT: <XCircle size={11} />,
    NEUTRAL: <Info size={11} />,
  };
  const c = colors[direction];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 4,
        background: c + "20",
        border: `1px solid ${c}50`,
        color: c,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      {icons[direction]}
      {label}: {direction}
    </div>
  );
}

export default function SignalPanel({ symbol, timeframe }: SignalPanelProps) {
  const { candles, isLoading: ohlcvLoading } = useOHLCV(symbol, timeframe);
  const { currentRate, isLoading: fundingLoading } = useFunding(symbol);
  const {
    openInterest,
    latestLongRatio,
    isLoading: oiLoading,
  } = useOpenInterest(symbol);

  const isLoading = ohlcvLoading || fundingLoading || oiLoading;

  const signal = useMemo(() => {
    if (candles.length === 0) return null;

    const currentPrice = candles[candles.length - 1]?.close ?? 0;
    const previousOI = openInterest
      ? openInterest.openInterest * 0.98 // Approximate previous OI
      : undefined;

    return generateSignals({
      currentFundingRate: currentRate,
      candles,
      openInterest: openInterest?.openInterest ?? 0,
      previousOI,
      longRatio: latestLongRatio,
      currentPrice,
    });
  }, [candles, currentRate, openInterest, latestLongRatio]);

  const currentPrice = candles[candles.length - 1]?.close ?? 0;

  return (
    <div
      className="card"
      style={{
        padding: 20,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          GÉNÉRATEUR DE SIGNAUX
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {symbol.replace("USDT", "/USDT")} • {timeframe.toUpperCase()}
        </div>
      </div>

      {isLoading || !signal ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          Calcul des signaux...
        </div>
      ) : (
        <>
          {/* Direction */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <DirectionBadge direction={signal.direction} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SubSignalBadge label="FR" direction={signal.fundingSignal} />
              <SubSignalBadge label="OI" direction={signal.oiSignal} />
              <SubSignalBadge label="L/S" direction={signal.lsSignal} />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                marginBottom: 6,
              }}
            >
              <span style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                CONFIANCE
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color:
                    signal.confidence > 70
                      ? "var(--green)"
                      : signal.confidence > 45
                      ? "var(--yellow)"
                      : "var(--text-secondary)",
                }}
              >
                {signal.confidence}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${signal.confidence}%`,
                  borderRadius: 4,
                  background:
                    signal.direction === "LONG"
                      ? "var(--green)"
                      : signal.direction === "SHORT"
                      ? "var(--red)"
                      : "var(--text-muted)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>

          {/* Levels */}
          <div
            style={{
              background: "#0d1117",
              borderRadius: 6,
              padding: 12,
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em" }}>
              NIVEAUX CLÉS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarSign size={13} color="var(--blue)" />
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 60 }}>ENTRÉE</span>
                <span style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600 }}>
                  {signal.entryZone}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={13} color="var(--red)" />
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 60 }}>STOP LOSS</span>
                <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>
                  {signal.slZone}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={13} color="var(--green)" />
                <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 60 }}>TAKE PROFIT</span>
                <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                  {signal.tpZone}
                </span>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 8,
                letterSpacing: "0.05em",
              }}
            >
              ANALYSE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {signal.reasons.map((reason, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    padding: "6px 10px",
                    borderRadius: 4,
                    background: "#0d1117",
                    borderLeft: `2px solid ${
                      signal.direction === "LONG"
                        ? "var(--green)"
                        : signal.direction === "SHORT"
                        ? "var(--red)"
                        : "var(--border)"
                    }`,
                    lineHeight: 1.5,
                  }}
                >
                  {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Current price footer */}
          <div
            style={{
              paddingTop: 10,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            <span>Prix actuel</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              ${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
