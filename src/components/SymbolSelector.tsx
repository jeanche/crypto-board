"use client";

import { ChevronDown } from "lucide-react";

const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "DOTUSDT",
];

const TIMEFRAMES = [
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1d" },
];

interface SymbolSelectorProps {
  symbol: string;
  timeframe: string;
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (t: string) => void;
}

export default function SymbolSelector({
  symbol,
  timeframe,
  onSymbolChange,
  onTimeframeChange,
}: SymbolSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
      }}
    >
      {/* Symbol Dropdown */}
      <div style={{ position: "relative" }}>
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text-primary)",
            padding: "8px 36px 8px 14px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            appearance: "none",
            outline: "none",
            minWidth: 140,
          }}
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s.replace("USDT", "/USDT")}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          color="var(--text-muted)"
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Timeframe Buttons */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: 3,
        }}
      >
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange(tf.value)}
            style={{
              padding: "5px 12px",
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "all 0.15s",
              background: timeframe === tf.value ? "var(--blue)" : "transparent",
              color: timeframe === tf.value ? "#0d1117" : "var(--text-secondary)",
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Current pair label */}
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          letterSpacing: "0.05em",
        }}
      >
        PERP FUTURES
      </div>
    </div>
  );
}
