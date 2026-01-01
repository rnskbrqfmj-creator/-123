export interface MenuItem {
  name: string;
  price: number;
  category: 'coffee' | 'milk_tea' | 'food' | 'dessert';
  margin: 'high' | 'medium' | 'low';
  stockLevel?: 'high' | 'medium' | 'low';
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  timestamp: number;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed';
  tableNumber?: string;
}

export interface DailyInsight {
  weather: string;
  focus: string;
  staffTip: string;
  suggestedCombo: string;
  cheer: string;
}

export interface SocialCopy {
  platform: 'Instagram' | 'Threads';
  content: string;
  hashtags: string[];
}

export interface FeedbackAnalysis {
  sentiment: string;
  profitInsight: string;
  efficiencyGap: string;
  summary: string;
}

export interface ProductRecipe {
  name: string;
  recipe: string;
  pricingStrategy: string;
  analysis: {
    costScore: number;
    difficultyScore: number;
    instagrammableScore: number;
    marginScore: number;
  };
}

export interface KpiData {
  annualGoal: number;
  currentRevenue: number;
  progress: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number; // 現有量
  maxStock: number;     // 叫貨量 (安全庫存/滿倉)
  unit: string;         // 單位 (kg, 包, 瓶)
  category: 'Ingredient' | 'Supply';
}

// History & Persistence Types
export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'daily' | 'social' | 'feedback' | 'product' | 'esg' | 'csv';
  data: any;
  summary: string; // 用於列表顯示的簡短摘要
}