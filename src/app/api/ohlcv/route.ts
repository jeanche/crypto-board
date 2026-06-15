import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const interval = searchParams.get("interval") || "15m";
  const limit = searchParams.get("limit") || "200";

  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();

    // Transform to lightweight-charts format
    const candles = data.map((k: unknown[]) => ({
      time: Math.floor((k[0] as number) / 1000),
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
    }));

    return NextResponse.json(candles, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("OHLCV fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch OHLCV data" }, { status: 500 });
  }
}
