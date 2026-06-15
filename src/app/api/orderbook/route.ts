import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const limit = searchParams.get("limit") || "20";

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();

    const bids = (data.bids as string[][]).map(([price, qty]) => ({
      price: parseFloat(price),
      qty: parseFloat(qty),
    }));

    const asks = (data.asks as string[][]).map(([price, qty]) => ({
      price: parseFloat(price),
      qty: parseFloat(qty),
    }));

    return NextResponse.json(
      { bids, asks, lastUpdateId: data.lastUpdateId },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Orderbook fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch orderbook data" }, { status: 500 });
  }
}
