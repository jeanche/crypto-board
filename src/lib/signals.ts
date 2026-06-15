export type SignalDirection = "LONG" | "SHORT" | "NEUTRAL";

export interface SignalResult {
  direction: SignalDirection;
  confidence: number; // 0-100
  reasons: string[];
  entryZone: string;
  slZone: string;
  tpZone: string;
  fundingSignal: SignalDirection | null;
  oiSignal: SignalDirection | null;
  lsSignal: SignalDirection | null;
}

export interface OHLCVCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SignalInputs {
  currentFundingRate: number;
  candles: OHLCVCandle[];
  openInterest: number;
  previousOI?: number;
  longRatio: number; // 0-1
  currentPrice: number;
}

function computeRSI(candles: OHLCVCandle[], period = 14): number {
  if (candles.length < period + 1) return 50;
  const closes = candles.map((c) => c.close);
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function generateSignals(inputs: SignalInputs): SignalResult {
  const { currentFundingRate, candles, openInterest, previousOI, longRatio, currentPrice } =
    inputs;

  const scores: Record<SignalDirection, number> = { LONG: 0, SHORT: 0, NEUTRAL: 0 };
  const reasons: string[] = [];

  let fundingSignal: SignalDirection | null = null;
  let oiSignal: SignalDirection | null = null;
  let lsSignal: SignalDirection | null = null;

  // ── 1. FUNDING RATE SIGNAL ──────────────────────────────────────────────
  if (currentFundingRate > 0.001) {
    // Extremely high positive FR → longs paying → market overextended → SHORT
    fundingSignal = "SHORT";
    scores.SHORT += 35;
    reasons.push(
      `Taux de financement élevé (${(currentFundingRate * 100).toFixed(4)}%) — Longs en excès, contraction probable`
    );
  } else if (currentFundingRate > 0.0003) {
    fundingSignal = "SHORT";
    scores.SHORT += 15;
    reasons.push(
      `Taux de financement positif (${(currentFundingRate * 100).toFixed(4)}%) — Légère pression haussière`
    );
  } else if (currentFundingRate < -0.0005) {
    // Negative FR → shorts paying → potential long bounce
    fundingSignal = "LONG";
    scores.LONG += 35;
    reasons.push(
      `Taux de financement négatif (${(currentFundingRate * 100).toFixed(4)}%) — Shorts en excès, rebond probable`
    );
  } else if (currentFundingRate < -0.0001) {
    fundingSignal = "LONG";
    scores.LONG += 15;
    reasons.push(
      `Taux de financement légèrement négatif (${(currentFundingRate * 100).toFixed(4)}%) — Pression baissière modérée`
    );
  } else {
    fundingSignal = "NEUTRAL";
    scores.NEUTRAL += 10;
    reasons.push(`Taux de financement neutre (${(currentFundingRate * 100).toFixed(4)}%)`);
  }

  // ── 2. OI DIVERGENCE SIGNAL ─────────────────────────────────────────────
  if (candles.length >= 2 && previousOI !== undefined && previousOI > 0) {
    const oiChange = (openInterest - previousOI) / previousOI;
    const recentCandles = candles.slice(-10);
    const priceChange =
      (recentCandles[recentCandles.length - 1].close - recentCandles[0].open) /
      recentCandles[0].open;

    if (priceChange > 0.005 && oiChange < -0.01) {
      // Price rising but OI falling → weakening uptrend → SHORT
      oiSignal = "SHORT";
      scores.SHORT += 25;
      reasons.push(
        `Divergence OI baissière — Prix en hausse (${(priceChange * 100).toFixed(2)}%) mais OI en baisse (${(oiChange * 100).toFixed(2)}%)`
      );
    } else if (priceChange < -0.005 && oiChange > 0.01) {
      // Price falling + OI rising → strong downtrend → SHORT
      oiSignal = "SHORT";
      scores.SHORT += 20;
      reasons.push(
        `OI en hausse avec prix en baisse — Tendance baissière forte confirmée (OI +${(oiChange * 100).toFixed(2)}%)`
      );
    } else if (priceChange > 0.005 && oiChange > 0.01) {
      // Price rising + OI rising → strong uptrend → LONG
      oiSignal = "LONG";
      scores.LONG += 20;
      reasons.push(
        `OI en hausse avec prix en hausse — Tendance haussière forte confirmée (OI +${(oiChange * 100).toFixed(2)}%)`
      );
    } else if (priceChange < -0.005 && oiChange < -0.01) {
      // Price falling + OI falling → weakening downtrend → LONG
      oiSignal = "LONG";
      scores.LONG += 15;
      reasons.push(
        `Divergence OI haussière — Prix en baisse mais OI diminue (épuisement vendeurs)`
      );
    } else {
      oiSignal = "NEUTRAL";
      scores.NEUTRAL += 5;
    }
  }

  // ── 3. LONG/SHORT RATIO SIGNAL ──────────────────────────────────────────
  if (longRatio > 0.65) {
    // Too many longs → contrarian SHORT
    lsSignal = "SHORT";
    scores.SHORT += 30;
    reasons.push(
      `${(longRatio * 100).toFixed(1)}% de longs retail — Positionnement excessif haussier, signal contrarian SHORT`
    );
  } else if (longRatio > 0.58) {
    lsSignal = "SHORT";
    scores.SHORT += 12;
    reasons.push(
      `${(longRatio * 100).toFixed(1)}% de longs retail — Légère surexposition haussière`
    );
  } else if (longRatio < 0.35) {
    // Too many shorts → contrarian LONG
    lsSignal = "LONG";
    scores.LONG += 30;
    reasons.push(
      `${(longRatio * 100).toFixed(1)}% de longs retail — Positionnement excessif baissier, signal contrarian LONG`
    );
  } else if (longRatio < 0.42) {
    lsSignal = "LONG";
    scores.LONG += 12;
    reasons.push(
      `${(longRatio * 100).toFixed(1)}% de longs retail — Légère surexposition baissière`
    );
  } else {
    lsSignal = "NEUTRAL";
    scores.NEUTRAL += 8;
    reasons.push(
      `Ratio long/short équilibré (${(longRatio * 100).toFixed(1)}% longs)`
    );
  }

  // ── 4. RSI ──────────────────────────────────────────────────────────────
  const rsi = computeRSI(candles);
  if (rsi > 75) {
    scores.SHORT += 15;
    reasons.push(`RSI suracheté à ${rsi.toFixed(1)} — Pression de vente attendue`);
  } else if (rsi > 65) {
    scores.SHORT += 5;
  } else if (rsi < 25) {
    scores.LONG += 15;
    reasons.push(`RSI survendu à ${rsi.toFixed(1)} — Rebond technique probable`);
  } else if (rsi < 35) {
    scores.LONG += 5;
  }

  // ── 5. DETERMINE FINAL DIRECTION ────────────────────────────────────────
  let direction: SignalDirection = "NEUTRAL";
  let confidence = 0;

  const total = scores.LONG + scores.SHORT + scores.NEUTRAL;
  if (total > 0) {
    if (scores.LONG > scores.SHORT && scores.LONG > scores.NEUTRAL) {
      direction = "LONG";
      confidence = Math.min(95, Math.round((scores.LONG / total) * 100 * 1.5));
    } else if (scores.SHORT > scores.LONG && scores.SHORT > scores.NEUTRAL) {
      direction = "SHORT";
      confidence = Math.min(95, Math.round((scores.SHORT / total) * 100 * 1.5));
    } else {
      direction = "NEUTRAL";
      confidence = Math.min(60, Math.round((scores.NEUTRAL / total) * 100));
    }
  }

  // ── 6. ENTRY / SL / TP LEVELS ──────────────────────────────────────────
  const recentHigh = candles.length
    ? Math.max(...candles.slice(-20).map((c) => c.high))
    : currentPrice * 1.02;
  const recentLow = candles.length
    ? Math.min(...candles.slice(-20).map((c) => c.low))
    : currentPrice * 0.98;

  const atr =
    candles.length >= 14
      ? candles.slice(-14).reduce((sum, c) => sum + (c.high - c.low), 0) / 14
      : currentPrice * 0.01;

  let entryZone = "";
  let slZone = "";
  let tpZone = "";

  if (direction === "LONG") {
    const entry = currentPrice;
    const sl = Math.max(recentLow, entry - atr * 1.5);
    const tp1 = entry + atr * 2;
    const tp2 = entry + atr * 3.5;
    entryZone = `$${entry.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    slZone = `$${sl.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    tpZone = `$${tp1.toLocaleString("en-US", { maximumFractionDigits: 2 })} — $${tp2.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  } else if (direction === "SHORT") {
    const entry = currentPrice;
    const sl = Math.min(recentHigh, entry + atr * 1.5);
    const tp1 = entry - atr * 2;
    const tp2 = entry - atr * 3.5;
    entryZone = `$${entry.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    slZone = `$${sl.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    tpZone = `$${tp1.toLocaleString("en-US", { maximumFractionDigits: 2 })} — $${tp2.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  } else {
    entryZone = "En attente d'un signal clair";
    slZone = "—";
    tpZone = "—";
  }

  return {
    direction,
    confidence,
    reasons,
    entryZone,
    slZone,
    tpZone,
    fundingSignal,
    oiSignal,
    lsSignal,
  };
}
