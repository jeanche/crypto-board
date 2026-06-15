"use client";

import { Activity, TrendingUp, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }) + " UTC"
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            background: "var(--blue)",
            borderRadius: 6,
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <TrendingUp size={18} color="#0d1117" strokeWidth={2.5} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.05em",
              color: "var(--text-primary)",
            }}
          >
            CRYPTO<span style={{ color: "var(--blue)" }}>BOARD</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
            PROFESSIONAL TRADING TERMINAL
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            className="pulse-green"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--green)",
            }}
          />
          <span style={{ fontSize: 12, color: "var(--green)", letterSpacing: "0.05em" }}>
            LIVE
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Binance Futures
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={14} color="var(--text-muted)" />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              fontFamily: "monospace",
              minWidth: 140,
            }}
          >
            {time}
          </span>
        </div>
      </div>
    </header>
  );
}
