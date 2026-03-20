import { NextRequest, NextResponse } from 'next/server';

// This route handles checking whether any price alerts have been triggered
// It's called periodically from the alerts page

export async function POST(req: NextRequest) {
  try {
    const { alerts, currentPrices } = await req.json();

    const triggered = alerts
      .filter((alert: any) => alert.active && !alert.triggered)
      .filter((alert: any) => {
        const marketItem = currentPrices?.find(
          (p: any) => p.item.toLowerCase().includes(alert.item.toLowerCase())
        );
        if (!marketItem) return false;

        if (alert.direction === 'below') {
          return marketItem.currentPrice <= alert.targetPrice;
        } else {
          return marketItem.currentPrice >= alert.targetPrice;
        }
      })
      .map((alert: any) => alert.id);

    return NextResponse.json({ triggered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
