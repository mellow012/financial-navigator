export interface Transaction {
  id: string;
  description: string;
  name?: string;          // display name (alias for description)
  amount: number;
  date: string;           // ISO string
  category: string;
  type: 'income' | 'expense';
  uid: string;
  ref?: string;           // optional reference number
  account?: string;       // account id
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
}

export interface PriceAlert {
  id: string;
  uid: string;
  item: string;
  category: string;
  targetPrice: number;
  currentPrice: number;
  direction: 'above' | 'below';
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  notifyViaSMS: boolean;
  phoneNumber?: string;
}

export interface MarketPrice {
  item: string;
  category: 'food' | 'fuel' | 'utilities' | 'other';
  currentPrice: number;
  previousPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  source: string;
  lastUpdated: string;
}

export interface AdvisorTip {
  id: string;
  type: 'warning' | 'success' | 'info' | 'insight';
  title: string;
  message: string;
  priority: number;
}