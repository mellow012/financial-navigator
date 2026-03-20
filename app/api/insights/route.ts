import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cache 6 hours — Groq is fast but no built-in web search, so we use known data
let insightsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (insightsCache && Date.now() - insightsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...insightsCache.data, cached: true });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: 'You are a Malawi market data analyst. Return ONLY valid JSON, no markdown, no text outside the JSON.',
        },
        {
          role: 'user',
          content: `Based on your knowledge of Malawi's economy in 2025, provide current approximate retail prices for essential goods.
Use realistic 2025 Malawian Kwacha prices. Malawi annual inflation is around 28.7%.

Return ONLY this JSON:
{
  "inflationRate": 28.7,
  "lastUpdated": "2025-03",
  "prices": [
    {"item":"Maize Flour (25kg)","category":"food","currentPrice":22000,"previousPrice":19500,"unit":"bag","trend":"up","changePercent":12.8,"source":"Blantyre markets","emoji":"🌽"},
    {"item":"Cooking Oil (2L)","category":"food","currentPrice":8500,"previousPrice":8100,"unit":"bottle","trend":"up","changePercent":4.9,"source":"Shoprite","emoji":"🫗"},
    {"item":"Rice (1kg)","category":"food","currentPrice":2800,"previousPrice":2950,"unit":"kg","trend":"down","changePercent":-5.1,"source":"Chipiku","emoji":"🍚"},
    {"item":"Sugar (1kg)","category":"food","currentPrice":1600,"previousPrice":1550,"unit":"kg","trend":"up","changePercent":3.2,"source":"Shoprite","emoji":"🍬"},
    {"item":"Tomatoes (1kg)","category":"food","currentPrice":1200,"previousPrice":1800,"unit":"kg","trend":"down","changePercent":-33.3,"source":"Limbe Market","emoji":"🍅"},
    {"item":"Bread (white loaf)","category":"food","currentPrice":1100,"previousPrice":1000,"unit":"loaf","trend":"up","changePercent":10.0,"source":"Various","emoji":"🍞"},
    {"item":"Petrol (litre)","category":"fuel","currentPrice":2890,"previousPrice":2750,"unit":"litre","trend":"up","changePercent":5.1,"source":"MERA","emoji":"⛽"},
    {"item":"Diesel (litre)","category":"fuel","currentPrice":2950,"previousPrice":2820,"unit":"litre","trend":"up","changePercent":4.6,"source":"MERA","emoji":"🛢️"},
    {"item":"Electricity (kWh)","category":"utilities","currentPrice":185,"previousPrice":175,"unit":"kWh","trend":"up","changePercent":5.7,"source":"ESCOM","emoji":"⚡"},
    {"item":"Water (m³)","category":"utilities","currentPrice":420,"previousPrice":420,"unit":"m³","trend":"stable","changePercent":0,"source":"Water Board","emoji":"💧"}
  ],
  "alerts": [
    {"type":"opportunity","title":"Tomato Prices Falling","message":"Tomatoes down significantly this season — good time to buy in bulk for home use."},
    {"type":"warning","title":"Maize Prices Rising","message":"Maize flour prices rising due to supply pressures. Consider stocking up before further increases."},
    {"type":"warning","title":"Fuel Costs Up","message":"Petrol and diesel prices rose following the latest MERA review. Reduce non-essential travel where possible."}
  ],
  "marketSummary": "Malawi markets remain under pressure with annual inflation at 28.7%. Maize prices continue to rise while some fresh produce like tomatoes are easing. Fuel prices remain elevated following MERA's latest adjustment."
}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = getFallbackData();
    }

    insightsCache = { data: parsed, timestamp: Date.now() };
    return NextResponse.json(parsed);

  } catch (err: any) {
    console.error('Groq insights error:', err?.message || err);
    return NextResponse.json(getFallbackData());
  }
}

function getFallbackData() {
  return {
    inflationRate: 28.7,
    lastUpdated: '2025-03',
    cached: false,
    prices: [
      { item: 'Maize Flour (25kg)', category: 'food',      currentPrice: 22000, previousPrice: 19500, unit: 'bag',    trend: 'up',     changePercent: 12.8,  source: 'Blantyre markets', emoji: '🌽' },
      { item: 'Cooking Oil (2L)',   category: 'food',      currentPrice: 8500,  previousPrice: 8100,  unit: 'bottle', trend: 'up',     changePercent: 4.9,   source: 'Shoprite',         emoji: '🫗' },
      { item: 'Rice (1kg)',         category: 'food',      currentPrice: 2800,  previousPrice: 2950,  unit: 'kg',     trend: 'down',   changePercent: -5.1,  source: 'Chipiku',          emoji: '🍚' },
      { item: 'Sugar (1kg)',        category: 'food',      currentPrice: 1600,  previousPrice: 1550,  unit: 'kg',     trend: 'up',     changePercent: 3.2,   source: 'Shoprite',         emoji: '🍬' },
      { item: 'Tomatoes (1kg)',     category: 'food',      currentPrice: 1200,  previousPrice: 1800,  unit: 'kg',     trend: 'down',   changePercent: -33.3, source: 'Limbe Market',     emoji: '🍅' },
      { item: 'Bread (white loaf)', category: 'food',      currentPrice: 1100,  previousPrice: 1000,  unit: 'loaf',   trend: 'up',     changePercent: 10.0,  source: 'Various',          emoji: '🍞' },
      { item: 'Petrol (litre)',     category: 'fuel',      currentPrice: 2890,  previousPrice: 2750,  unit: 'litre',  trend: 'up',     changePercent: 5.1,   source: 'MERA',             emoji: '⛽' },
      { item: 'Diesel (litre)',     category: 'fuel',      currentPrice: 2950,  previousPrice: 2820,  unit: 'litre',  trend: 'up',     changePercent: 4.6,   source: 'MERA',             emoji: '🛢️' },
      { item: 'Electricity (kWh)', category: 'utilities', currentPrice: 185,   previousPrice: 175,   unit: 'kWh',    trend: 'up',     changePercent: 5.7,   source: 'ESCOM',            emoji: '⚡' },
      { item: 'Water (m³)',         category: 'utilities', currentPrice: 420,   previousPrice: 420,   unit: 'm³',     trend: 'stable', changePercent: 0,     source: 'Water Board',      emoji: '💧' },
    ],
    alerts: [
      { type: 'opportunity', title: 'Tomato Prices Falling',  message: 'Tomatoes down significantly — good time to buy in bulk.' },
      { type: 'warning',     title: 'Maize Prices Rising',    message: 'Maize flour up over 12% — consider stocking up now.' },
      { type: 'warning',     title: 'Fuel Costs Up',          message: 'Petrol and diesel up ~5% following MERA\'s latest review.' },
    ],
    marketSummary: "Malawi markets remain under pressure with annual inflation at 28.7%. Maize prices continue rising while some fresh produce is easing seasonally. Fuel costs remain elevated.",
  };
}
