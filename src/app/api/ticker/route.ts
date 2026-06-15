import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/24hr`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();

    // Sort by quote volume descending, take top 20
    const sorted = (data as Array<{
      symbol: string;
      priceChange: string;
      priceChangePercent: string;
      lastPrice: string;
      quoteVolume: string;
      volume: string;
    }>)
      .filter((t) => t.symbol.endsWith("USDT"))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map((t) => ({
        symbol: t.symbol,
        priceChange: parseFloat(t.priceChange),
        priceChangePercent: parseFloat(t.priceChangePercent),
        lastPrice: parseFloat(t.lastPrice),
        quoteVolume: parseFloat(t.quoteVolume),
        volume: parseFloat(t.volume),
      }));

    return NextResponse.json(sorted, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Ticker fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch ticker data" }, { status: 500 });
  }
}
