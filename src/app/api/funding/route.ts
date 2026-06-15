import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const limit = searchParams.get("limit") || "10";

  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=${limit}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error(`Binance API error: ${res.status}`);
    }

    const data = await res.json();

    const rates = data.map((item: { fundingTime: number; fundingRate: string; markPrice?: string }) => ({
      time: item.fundingTime,
      rate: parseFloat(item.fundingRate),
      markPrice: item.markPrice ? parseFloat(item.markPrice) : null,
    }));

    return NextResponse.json(rates, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Funding rate fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch funding rate data" }, { status: 500 });
  }
}
