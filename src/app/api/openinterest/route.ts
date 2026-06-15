import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTCUSDT";

  try {
    const [oiRes, lsRes] = await Promise.all([
      fetch(
        `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`,
        { cache: "no-store" }
      ),
      fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=24`,
        { cache: "no-store" }
      ),
    ]);

    if (!oiRes.ok) throw new Error(`OI fetch error: ${oiRes.status}`);
    if (!lsRes.ok) throw new Error(`L/S ratio fetch error: ${lsRes.status}`);

    const oiData = await oiRes.json();
    const lsData = await lsRes.json();

    return NextResponse.json(
      {
        openInterest: {
          symbol: oiData.symbol,
          openInterest: parseFloat(oiData.openInterest),
          time: oiData.time,
        },
        longShortRatio: lsData.map((item: {
          symbol: string;
          longShortRatio: string;
          longAccount: string;
          shortAccount: string;
          timestamp: number;
        }) => ({
          symbol: item.symbol,
          ratio: parseFloat(item.longShortRatio),
          longAccount: parseFloat(item.longAccount),
          shortAccount: parseFloat(item.shortAccount),
          timestamp: item.timestamp,
        })),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Open interest fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch open interest data" }, { status: 500 });
  }
}
