"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import MarketOverview from "@/components/MarketOverview";
import SymbolSelector from "@/components/SymbolSelector";
import FundingRateBar from "@/components/FundingRateBar";
import OpenInterestPanel from "@/components/OpenInterestPanel";
import LongShortRatio from "@/components/LongShortRatio";
import OrderbookPanel from "@/components/OrderbookPanel";
import SignalPanel from "@/components/SignalPanel";
import FuturesTable from "@/components/FuturesTable";

// Dynamically import chart to avoid SSR issues with lightweight-charts
const CandlestickChart = dynamic(() => import("@/components/CandlestickChart"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 13,
      }}
    >
      Chargement du graphique...
    </div>
  ),
});

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("15m");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <Header />

      <main style={{ padding: "16px 20px", maxWidth: "1920px", margin: "0 auto" }}>
        {/* Row 1: Market Overview */}
        <MarketOverview />

        {/* Row 2: Symbol + Timeframe selector */}
        <SymbolSelector
          symbol={symbol}
          timeframe={timeframe}
          onSymbolChange={setSymbol}
          onTimeframeChange={setTimeframe}
        />

        {/* Row 3: Chart + Signal Panel */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 12,
            marginBottom: 12,
            height: 520,
          }}
        >
          <CandlestickChart symbol={symbol} timeframe={timeframe} />
          <SignalPanel symbol={symbol} timeframe={timeframe} />
        </div>

        {/* Row 4: Funding | OI | L/S | Orderbook */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <FundingRateBar symbol={symbol} />
          <OpenInterestPanel symbol={symbol} />
          <LongShortRatio symbol={symbol} />
          <OrderbookPanel symbol={symbol} />
        </div>

        {/* Row 5: Futures Screener Table */}
        <FuturesTable
          activeSymbol={symbol}
          onSymbolSelect={(s) => setSymbol(s)}
        />
      </main>
    </div>
  );
}
