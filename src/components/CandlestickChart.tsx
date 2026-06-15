"use client";

import { useEffect, useRef, useMemo } from "react";
import { useOHLCV } from "@/hooks/useOHLCV";
import { Loader2 } from "lucide-react";

interface CandlestickChartProps {
  symbol: string;
  timeframe: string;
}

function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(period).fill(50);
  for (let i = period; i < closes.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

export default function CandlestickChart({ symbol, timeframe }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts")["createChart"]> | null>(null);
  const candleSeriesRef = useRef<unknown>(null);
  const volumeSeriesRef = useRef<unknown>(null);
  const rsiSeriesRef = useRef<unknown>(null);
  const rsiChartRef = useRef<ReturnType<typeof import("lightweight-charts")["createChart"]> | null>(null);

  const { candles, isLoading, isError } = useOHLCV(symbol, timeframe);

  const rsiValues = useMemo(() => {
    if (candles.length < 15) return [];
    const closes = candles.map((c) => c.close);
    const rsi = computeRSI(closes, 14);
    return candles.map((c, i) => ({ time: c.time as number, value: rsi[i] }));
  }, [candles]);

  useEffect(() => {
    if (!containerRef.current) return;

    import("lightweight-charts").then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries }) => {
      if (!containerRef.current) return;

      // Cleanup previous charts
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }

      const container = containerRef.current;
      const totalHeight = container.clientHeight || 400;
      const mainHeight = Math.floor(totalHeight * 0.72);
      const rsiHeight = totalHeight - mainHeight;

      // ── Main chart ──────────────────────────────────────────────────────
      const mainDiv = container.querySelector<HTMLDivElement>("#chart-main")!;
      const rsiDiv = container.querySelector<HTMLDivElement>("#chart-rsi")!;
      mainDiv.style.height = `${mainHeight}px`;
      rsiDiv.style.height = `${rsiHeight}px`;

      const chartOptions = {
        layout: {
          background: { color: "#0d1117" },
          textColor: "#8b949e",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#21262d" },
          horzLines: { color: "#21262d" },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: "#58a6ff",
            width: 1 as const,
            style: 1,
            labelBackgroundColor: "#161b22",
          },
          horzLine: {
            color: "#58a6ff",
            width: 1 as const,
            style: 1,
            labelBackgroundColor: "#161b22",
          },
        },
        rightPriceScale: {
          borderColor: "#30363d",
          textColor: "#8b949e",
        },
        timeScale: {
          borderColor: "#30363d",
          timeVisible: true,
          secondsVisible: false,
          barSpacing: 8,
        },
      };

      const mainChart = createChart(mainDiv, {
        ...chartOptions,
        width: mainDiv.clientWidth,
        height: mainHeight,
      });
      chartRef.current = mainChart;

      // Candlestick series
      const candleSeries = mainChart.addSeries(CandlestickSeries, {
        upColor: "#3fb950",
        downColor: "#f85149",
        borderUpColor: "#3fb950",
        borderDownColor: "#f85149",
        wickUpColor: "#3fb950",
        wickDownColor: "#f85149",
      });
      candleSeriesRef.current = candleSeries;

      // Volume series (histogram below candles)
      const volumeSeries = mainChart.addSeries(HistogramSeries, {
        color: "#58a6ff",
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      });
      mainChart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;

      // ── RSI chart ────────────────────────────────────────────────────────
      const rsiChart = createChart(rsiDiv, {
        ...chartOptions,
        width: rsiDiv.clientWidth,
        height: rsiHeight,
        timeScale: {
          ...chartOptions.timeScale,
          visible: true,
        },
      });
      rsiChartRef.current = rsiChart;

      const rsiLine = rsiChart.addSeries(LineSeries, {
        color: "#bc8cff",
        lineWidth: 2 as const,
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
      });
      rsiSeriesRef.current = rsiLine;

      // RSI reference lines via price lines
      // (lightweight-charts doesn't have horizontal lines as a first-class API in v5 easily,
      //  so we add them as baseline price lines on the series)
      rsiLine.createPriceLine({ price: 70, color: "#f8514960", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
      rsiLine.createPriceLine({ price: 30, color: "#3fb95060", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
      rsiLine.createPriceLine({ price: 50, color: "#30363d", lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: "" });

      // Sync timescales
      mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) rsiChart.timeScale().setVisibleLogicalRange(range);
      });
      rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) mainChart.timeScale().setVisibleLogicalRange(range);
      });

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (mainDiv) mainChart.resize(mainDiv.clientWidth, mainHeight);
        if (rsiDiv) rsiChart.resize(rsiDiv.clientWidth, rsiHeight);
      });
      ro.observe(container);

      return () => {
        ro.disconnect();
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize only once

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const candleSeries = candleSeriesRef.current as {
      setData: (data: unknown[]) => void;
    };
    const volumeSeries = volumeSeriesRef.current as {
      setData: (data: unknown[]) => void;
    };

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "#3fb95050" : "#f8514950",
      }))
    );
  }, [candles]);

  // Update RSI
  useEffect(() => {
    if (!rsiSeriesRef.current || rsiValues.length === 0) return;
    const rsiSeries = rsiSeriesRef.current as {
      setData: (data: unknown[]) => void;
    };
    rsiSeries.setData(rsiValues);
  }, [rsiValues]);

  // Fit content when symbol/timeframe changes
  useEffect(() => {
    if (chartRef.current && candles.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
    if (rsiChartRef.current && rsiValues.length > 0) {
      rsiChartRef.current.timeScale().fitContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  return (
    <div
      className="card"
      style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {/* Chart header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {symbol.replace("USDT", "/USDT")}
          </span>
          {candles.length > 0 && (
            <>
              <span
                style={{
                  color:
                    candles[candles.length - 1].close >= candles[candles.length - 1].open
                      ? "var(--green)"
                      : "var(--red)",
                  fontWeight: 600,
                  fontSize: 16,
                  fontFamily: "monospace",
                }}
              >
                $
                {candles[candles.length - 1].close.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                H: {candles[candles.length - 1].high.toFixed(2)} L:{" "}
                {candles[candles.length - 1].low.toFixed(2)}
              </span>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 10, height: 3, borderRadius: 1, background: "#bc8cff" }} />
            <span style={{ color: "var(--text-muted)" }}>RSI(14)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <div style={{ width: 10, height: 3, borderRadius: 1, background: "#3fb950" }} />
            <span style={{ color: "var(--text-muted)" }}>Volume</span>
          </div>
          {isLoading && <Loader2 size={13} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />}
        </div>
      </div>

      {/* Chart area */}
      <div
        ref={containerRef}
        style={{ flex: 1, position: "relative", overflow: "hidden" }}
      >
        {isError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--red)",
              fontSize: 13,
            }}
          >
            Erreur de chargement des données
          </div>
        )}
        <div id="chart-main" style={{ width: "100%", position: "relative" }} />
        <div
          id="chart-rsi"
          style={{
            width: "100%",
            position: "relative",
            borderTop: "1px solid var(--border)",
          }}
        />
        {/* RSI Label */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 8,
            fontSize: 10,
            color: "#bc8cff",
            pointerEvents: "none",
            letterSpacing: "0.05em",
          }}
        >
          RSI(14)
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
