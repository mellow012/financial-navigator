import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM = `You are SmartFin's AI financial advisor for Malawians managing money during 28.7% annual inflation.

Key context:
- Currency: Malawian Kwacha (MWK / K)
- Inflation: 28.7% annually (2025)
- Mobile money: Airtel Money, TNM Mpamba
- Key staples: maize flour, rice, cooking oil, sugar, tomatoes
- Stores: Shoprite, Chipiku, Game, Choppies, People's Supermarket
- Utilities: ESCOM electricity, local water boards
- Fuel prices set by MERA

IMPORTANT: You must respond with ONLY a raw JSON object. No markdown, no backticks, no explanations — just the JSON object starting with { and ending with }.`;

/** Extract the first valid JSON object from a string, even if surrounded by text */
function extractJSON(raw: string): any {
  // Try direct parse first
  try {
    return JSON.parse(raw.trim());
  } catch {}

  // Strip markdown fences
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  // Find the first { ... } block using brace counting
  const start = raw.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response');

  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) throw new Error('Unclosed JSON object in response');

  return JSON.parse(raw.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  try {
    const { transactions, stats, question } = await req.json();

    let userPrompt: string;

    if (question) {
      userPrompt = `The user asks: "${question}"

Their finances:
- Monthly Income: K${stats.totalIncome?.toFixed(0) || 0}
- Monthly Expenses: K${stats.totalExpense?.toFixed(0) || 0}
- Savings Rate: ${stats.savingsRate?.toFixed(1) || 0}%
- Food Spend: K${stats.foodSpend?.toFixed(0) || 0}
- Transactions logged: ${transactions?.length || 0}

Respond with ONLY this JSON object (no other text):
{"answer":"your 3-5 sentence answer here","tips":[]}`;
    } else {
      const cats: Record<string, number> = {};
      for (const tx of transactions || []) {
        if (tx.type === 'expense') {
          cats[tx.category] = (cats[tx.category] || 0) + Math.abs(tx.amount);
        }
      }
      const catStr = Object.entries(cats)
        .sort(([, a], [, b]) => b - a)
        .map(([k, v]) => `  ${k}: K${v.toFixed(0)}`)
        .join('\n') || '  none yet';

      userPrompt = `Analyze these finances:

Income: K${stats.totalIncome?.toFixed(0) || 0}
Expenses: K${stats.totalExpense?.toFixed(0) || 0}
Savings Rate: ${stats.savingsRate?.toFixed(1) || 0}%
Food: K${stats.foodSpend?.toFixed(0) || 0} | Fuel: K${stats.fuelSpend?.toFixed(0) || 0} | Utilities: K${stats.utilitiesSpend?.toFixed(0) || 0}
Transactions: ${transactions?.length || 0}

Spending by category:
${catStr}

Respond with ONLY this JSON object (no other text before or after):
{"tips":[{"id":"tip-1","type":"warning","title":"Short title","message":"2-3 sentence advice.","priority":1}],"summary":"One paragraph summary."}

Generate 5-6 tips. type must be one of: warning, success, info, insight. priority: 1=urgent 2=important 3=fyi`;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }, // forces pure JSON output
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = extractJSON(raw);
    return NextResponse.json(parsed);

  } catch (err: any) {
    console.error('Groq advisor error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to generate advice', details: err.message },
      { status: 500 }
    );
  }
}