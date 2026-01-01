import React, { useState, useEffect } from 'react';
import { 
  Sun, Target, Upload, Download, Loader2, Copy,
  CheckCircle, AlertTriangle, Coffee,
  Leaf, BarChart3, History, Trash2, ChevronRight,
  DollarSign
} from './icons';
import { 
  getDailyFocus, generateSocialPost, analyzeReviews, 
  generateProductRecipe, generateProductImage, analyzeCsvData, generateESGTips
} from '../services/geminiService';
import { MENU_DATA, INVENTORY_DATA } from '../constants';
import { 
  InventoryItem, HistoryItem, Order, OrderItem, MenuItem,
  DailyInsight, FeedbackAnalysis, ProductRecipe
} from '../types';

interface ToolsProps {
  activeTab: string;
  isGuest?: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  all: '全部品項',
  coffee: '手沖咖啡',
  milk_tea: '特調飲品',
  food: '輕食餐點',
  dessert: '手工甜點'
};

// Safe LocalStorage Helper
const getSafeLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

export const Tools: React.FC<ToolsProps> = ({ activeTab, isGuest = false }) => {
  // ==========================================
  // 1. Persistent State (LocalStorage)
  // ==========================================
  
  // Inventory Data
  const [inventory, setInventory] = useState<InventoryItem[]>(() => 
    getSafeLocalStorage('woosh_inventory', INVENTORY_DATA)
  );

  // KPI Goals
  const [kpiRevenue, setKpiRevenue] = useState(() => {
    if (typeof window === 'undefined') return 3800000;
    return Number(localStorage.getItem('woosh_kpi_revenue')) || 3800000;
  });
  const [kpiCustomers, setKpiCustomers] = useState(() => {
    if (typeof window === 'undefined') return 12000;
    return Number(localStorage.getItem('woosh_kpi_customers')) || 12000;
  });
  const [kpiTicket, setKpiTicket] = useState(() => {
    if (typeof window === 'undefined') return 350;
    return Number(localStorage.getItem('woosh_kpi_ticket')) || 350;
  });

  // Operation History (Saved generations)
  const [history, setHistory] = useState<HistoryItem[]>(() => 
    getSafeLocalStorage('woosh_history', [])
  );

  // Live Orders
  const [orders, setOrders] = useState<Order[]>(() => 
    getSafeLocalStorage('woosh_orders', [])
  );

  // ==========================================
  // 2. Transient State (Current Session)
  // ==========================================
  const [loading, setLoading] = useState(false);
  
  // Tool Inputs & Outputs
  const [dailyData, setDailyData] = useState<DailyInsight | null>(null);
  
  const [socialInput, setSocialInput] = useState('');
  const [socialResult, setSocialResult] = useState('');
  
  const [reviewsInput, setReviewsInput] = useState('');
  const [reviewAnalysis, setReviewAnalysis] = useState<FeedbackAnalysis | null>(null);
  
  const [productIdea, setProductIdea] = useState('');
  const [productResult, setProductResult] = useState<ProductRecipe | null>(null);
  const [productImage, setProductImage] = useState('');
  
  const [csvAnalysis, setCsvAnalysis] = useState('');
  const [esgTips, setEsgTips] = useState('');

  // Menu Category State (Shared for Guest and Owner view simplicity)
  const [menuCategory, setMenuCategory] = useState<string>('all');
  
  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ==========================================
  // 3. Effects for Persistence
  // ==========================================
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('woosh_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('woosh_kpi_revenue', String(kpiRevenue));
      localStorage.setItem('woosh_kpi_customers', String(kpiCustomers));
      localStorage.setItem('woosh_kpi_ticket', String(kpiTicket));
    }
  }, [kpiRevenue, kpiCustomers, kpiTicket]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('woosh_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('woosh_orders', JSON.stringify(orders));
  }, [orders]);

  // ==========================================
  // 4. Helper Functions
  // ==========================================

  // History Management
  const addToHistory = (type: HistoryItem['type'], data: unknown, summary: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type,
      data,
      summary
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadFromHistory = (item: HistoryItem) => {
    if (item.type === 'daily') setDailyData(item.data as DailyInsight);
    if (item.type === 'social') setSocialResult(item.data as string);
    if (item.type === 'feedback') setReviewAnalysis(item.data as FeedbackAnalysis);
    if (item.type === 'product') {
       const pData = item.data as { result: ProductRecipe, image: string };
       setProductResult(pData.result);
       setProductImage(pData.image);
    }
    if (item.type === 'esg') setEsgTips(item.data as string);
    if (item.type === 'csv') setCsvAnalysis(item.data as string);
  };

  // Inventory Management
  const updateInventoryStock = (id: string, field: 'currentStock' | 'maxStock', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setInventory(prev => prev.map(item => item.id === id ? { ...item, [field]: num } : item));
  };

  // Cart Management
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
        const existing = prev.find(i => i.name === item.name);
        if (existing) {
            return prev.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemName: string) => {
      setCart(prev => prev.filter(i => i.name !== itemName));
  }

  const submitOrder = () => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 5).toUpperCase(),
        timestamp: Date.now(),
        items: cart,
        total,
        status: 'pending'
    };

    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setShowCartModal(false);
    setOrderSuccess(true);
    setTimeout(() => setOrderSuccess(false), 3000);
  };

  const completeOrder = (orderId: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
  };

  const calculateCartTotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Revenue Calculations
  const getRevenueStats = () => {
      const completedOrders = orders.filter(o => o.status === 'completed');
      
      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
      const totalOrders = completedOrders.length;
      
      const itemSales: Record<string, number> = {};
      completedOrders.forEach(order => {
          order.items.forEach(item => {
              itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
          });
      });

      // Sort items by quantity sold
      const sortedItems = Object.entries(itemSales)
          .sort(([, a], [, b]) => b - a)
          .map(([name, count]) => ({ name, count }));

      return { totalRevenue, totalOrders, sortedItems };
  };

  // UI Renderers
  const renderBar = (label: string, value: number, color: string) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs mb-1 font-bold text-gray-500">
            <span>{label}</span>
            <span>{value}/10</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${value * 10}%` }}></div>
        </div>
    </div>
  );

  const renderHistoryList = (type: HistoryItem['type']) => {
    const filtered = history.filter(h => h.type === type);
    if (filtered.length === 0) return null;

    return (
      <div className="mt-12 animate-fade-in border-t border-gray-100 pt-8">
        <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
          <History size={18} /> 歷史紀錄
        </h3>
        <div className="space-y-3">
          {filtered.map(item => (
            <div 
              key={item.id} 
              onClick={() => loadFromHistory(item)}
              className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:border-[#3f6212]/30 cursor-pointer flex justify-between items-center group transition-all hover:shadow-md"
            >
              <div>
                <div className="text-xs text-gray-400 mb-1">
                  {new Date(item.timestamp).toLocaleString('zh-TW')}
                </div>
                <div className="text-sm font-medium text-gray-700 line-clamp-1">
                  {item.summary}
                </div>
              </div>
              <button 
                onClick={(e) => deleteHistory(item.id, e)}
                className="text-gray-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                title="刪除紀錄"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // 5. Action Handlers
  // ==========================================

  const handleDailyFocus = async () => {
    setLoading(true);
    try {
      const data = await getDailyFocus();
      setDailyData(data);
      addToHistory('daily', data, `${data.weather} - ${data.focus}`);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Auto-Fetch Daily Focus Logic
  useEffect(() => {
    if (activeTab === 'daily' && !isGuest && !dailyData && !loading) {
       const todayStr = new Date().toLocaleDateString('zh-TW');
       const recentDaily = history.find(h => h.type === 'daily' && new Date(h.timestamp).toLocaleDateString('zh-TW') === todayStr);
       
       if (recentDaily) {
         setDailyData(recentDaily.data as DailyInsight);
       } else {
         handleDailyFocus();
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isGuest]); 

  const handleSocialGen = async () => {
    setLoading(true);
    try {
      const res = await generateSocialPost(socialInput, 'Instagram');
      setSocialResult(res);
      addToHistory('social', res, `文案：${socialInput.substring(0, 15)}...`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleReviewAnalysis = async () => {
    setLoading(true);
    try {
      const data = await analyzeReviews(reviewsInput);
      setReviewAnalysis(data);
      addToHistory('feedback', data, `分析：${data.summary.substring(0, 15)}...`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleNewProduct = async () => {
    setLoading(true);
    try {
      const recipeData = await generateProductRecipe(productIdea);
      setProductResult(recipeData);
      const img = await generateProductImage(recipeData.name + " " + recipeData.recipe);
      setProductImage(img);
      addToHistory('product', { result: recipeData, image: img }, `新品：${recipeData.name}`);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleESGTips = async () => {
      setLoading(true);
      try {
          const invList = inventory.map(i => `${i.name}: ${i.currentStock}/${i.maxStock}`).join(', ');
          const tips = await generateESGTips(invList);
          setEsgTips(tips);
          addToHistory('esg', tips, `ESG 建議 - ${new Date().toLocaleDateString()}`);
      } catch(e) { console.error(e); }
      setLoading(false);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'menu' | 'revenue') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      try {
        const analysis = await analyzeCsvData(text, type);
        setCsvAnalysis(analysis);
        addToHistory('csv', analysis, `${type === 'menu' ? '菜單' : '營收'}報表分析 - ${file.name}`);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const exportToCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // 6. Render
  // ==========================================
  return (
    <div className={`flex flex-col h-full ${isGuest ? 'text-stone-800' : 'text-[#78350f]'}`}>
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full">
        {loading && (
          <div className="flex flex-col justify-center items-center py-20 animate-pulse">
             <div className="bg-[#ecfccb] p-4 rounded-full mb-4">
                <Loader2 className="animate-spin h-10 w-10 text-[#3f6212]" />
             </div>
             <span className="text-[#3f6212] font-medium text-lg">AI 思考中...</span>
          </div>
        )}

        {/* --- Tab: Daily Focus (OWNER) --- */}
        {!loading && activeTab === 'daily' && !isGuest && (
          <div className="space-y-8 animate-fade-in">
            <header className="mb-6">
                <h2 className="text-3xl font-bold font-serif text-[#3f6212]">早安，老闆！</h2>
                <p className="text-gray-500">讓我們看看今天如何達成業績目標。</p>
            </header>

            {/* Live Orders Section for Owner */}
            {orders.some(o => o.status === 'pending') && (
                <div className="bg-white border-2 border-red-400 rounded-2xl p-6 shadow-md mb-6 animate-pulse-slow">
                    <h3 className="text-red-600 font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} /> 即時訂單 (來自訪客)
                    </h3>
                    <div className="space-y-3">
                        {orders.filter(o => o.status === 'pending').map(order => (
                            <div key={order.id} className="bg-red-50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="font-bold text-gray-800 flex gap-2">
                                        單號 #{order.id} 
                                        <span className="text-gray-400 font-normal text-sm">{new Date(order.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <span className="font-bold text-lg text-red-600">${order.total}</span>
                                    <button 
                                        onClick={() => completeOrder(order.id)}
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-red-600 flex-1 md:flex-none"
                                    >
                                        接單 / 完成
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!dailyData ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#3f6212]/10">
                <div className="bg-[#fdfbf7] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                   <Sun size={40} className="text-[#b45309]" />
                </div>
                <p className="mb-6 text-gray-600 text-lg">正在為您分析今日天氣與情報...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#3f6212] to-[#5d8b1b] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coffee size={120} />
                    </div>
                    <h3 className="font-bold text-lg opacity-80 mb-1">今日打氣</h3>
                    <p className="text-2xl font-serif leading-relaxed">"{dailyData.cheer}"</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3f6212]/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-700">
                      <Sun size={20} className="text-[#b45309]"/> 天氣與焦點
                    </h3>
                    <p className="text-4xl font-light mb-2 text-[#3f6212]">{dailyData.weather}</p>
                    <p className="text-gray-600 text-lg">{dailyData.focus}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#3f6212]/10">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-700">
                      <Target size={20} className="text-[#b45309]"/> 銷售策略
                    </h3>
                    <p className="text-[#b45309] font-medium text-xl mb-4">{dailyData.suggestedCombo}</p>
                    <div className="p-4 bg-[#ecfccb]/50 rounded-xl text-[#3f6212]">
                      <strong className="block mb-1 text-sm uppercase tracking-wide opacity-70">給夥伴的指令</strong> 
                      {dailyData.staffTip}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {renderHistoryList('daily')}
          </div>
        )}

        {/* --- Tab: Inventory (OWNER) --- */}
        {!loading && activeTab === 'inventory' && !isGuest && (
           <div className="space-y-6">
              <header className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-[#3f6212]">庫存管理中心</h2>
                    <p className="text-gray-500">輸入「現有量」與「叫貨量」，系統自動儲存，AI 隨時追蹤。</p>
                </div>
                <button 
                  onClick={() => exportToCSV(
                      `Name,Category,Current,Max,Status\n${inventory.map(i => `${i.name},${i.category},${i.currentStock},${i.maxStock},${(i.currentStock/i.maxStock)*100}%`).join('\n')}`, 
                      'inventory_log.csv'
                  )}
                  className="text-sm border border-[#3f6212] text-[#3f6212] px-4 py-2 rounded-lg hover:bg-[#ecfccb]"
                >
                  匯出紀錄
                </button>
              </header>

              <div className="bg-white rounded-xl shadow-sm border border-[#3f6212]/10 overflow-hidden overflow-x-auto">
                 <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-[#fdfbf7] border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-sm font-bold text-gray-500">品項名稱</th>
                            <th className="p-4 text-sm font-bold text-gray-500 w-24">現有量</th>
                            <th className="p-4 text-sm font-bold text-gray-500 w-24">叫貨量</th>
                            <th className="p-4 text-sm font-bold text-gray-500 w-32">庫存水位</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {inventory.map((item) => {
                            const ratio = item.currentStock / item.maxStock;
                            const statusColor = ratio < 0.2 ? 'bg-red-500' : ratio < 0.5 ? 'bg-yellow-400' : 'bg-green-500';
                            return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium">
                                        {item.name} <span className="text-xs text-gray-400 block">{item.category} ({item.unit})</span>
                                    </td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            value={item.currentStock}
                                            onChange={(e) => updateInventoryStock(item.id, 'currentStock', e.target.value)}
                                            className="w-16 p-1 border rounded text-center bg-gray-50 focus:ring-2 focus:ring-[#3f6212]"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input 
                                            type="number" 
                                            value={item.maxStock}
                                            onChange={(e) => updateInventoryStock(item.id, 'maxStock', e.target.value)}
                                            className="w-16 p-1 border rounded text-center bg-gray-50 focus:ring-2 focus:ring-[#3f6212]"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                                                <div className={`h-2.5 rounded-full ${statusColor}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold w-8">{Math.round(ratio * 100)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* --- Tab: ESG (OWNER) --- */}
        {!loading && activeTab === 'esg' && !isGuest && (
             <div className="space-y-6">
                <header>
                    <h2 className="text-2xl font-bold font-serif text-[#3f6212] flex items-center gap-2">
                        <Leaf className="text-green-600"/> ESG 永續經營
                    </h2>
                    <p className="text-gray-500">落實在地化採購、減少剩食，打造無所時時的品牌永續力。</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#ecfccb]/30 p-6 rounded-2xl border border-[#3f6212]/10">
                        <h3 className="font-bold text-[#3f6212] mb-2">在地採購指數</h3>
                        <div className="text-4xl font-bold text-[#3f6212] mb-2">75%</div>
                        <p className="text-sm text-gray-600">使用宜蘭在地食材（三星蔥、葛瑪蘭豬、職人鮮乳）。</p>
                    </div>
                     <div className="bg-[#ecfccb]/30 p-6 rounded-2xl border border-[#3f6212]/10">
                        <h3 className="font-bold text-[#3f6212] mb-2">循環杯使用率</h3>
                        <div className="text-4xl font-bold text-[#b45309] mb-2">20%</div>
                        <p className="text-sm text-gray-600">本月減少了 150 個一次性紙杯。</p>
                    </div>
                     <div className="bg-[#ecfccb]/30 p-6 rounded-2xl border border-[#3f6212]/10 cursor-pointer hover:bg-[#ecfccb]/50 transition" onClick={handleESGTips}>
                        <h3 className="font-bold text-[#3f6212] mb-2 flex items-center gap-1">AI 永續建議 <Target size={14}/></h3>
                        <p className="text-sm text-gray-600 mb-4">點擊分析庫存，生成減少浪費的行動方案。</p>
                        <div className="text-xs bg-white p-2 rounded text-gray-500 h-24 overflow-y-auto">
                             {esgTips ? esgTips.split('\n').slice(0,3).map((l, i) => <div key={i}>{l}</div>) : "點擊開始分析..."}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4">永續行動清單</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="text-green-600 mt-1" size={18} />
                            <span>推廣「醜食特餐」：利用外觀不佳但品質完好的食材製作濃湯。</span>
                        </li>
                         <li className="flex items-start gap-2">
                            <CheckCircle className="text-green-600 mt-1" size={18} />
                            <span>咖啡渣再利用：提供給附近農友堆肥，或製成除臭包送給熟客。</span>
                        </li>
                         <li className="flex items-start gap-2">
                            <CheckCircle className="text-green-600 mt-1" size={18} />
                            <span>社區連結：週末舉辦「小農市集」或咖啡講座。</span>
                        </li>
                    </ul>
                </div>
                {renderHistoryList('esg')}
             </div>
        )}

        {/* --- Tab: Social (OWNER) --- */}
        {!loading && activeTab === 'social' && !isGuest && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold font-serif text-[#3f6212]">社群文案助手</h2>
             <div className="flex flex-col gap-4">
               <textarea
                 className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3f6212] outline-none shadow-sm"
                 rows={4}
                 placeholder="描述照片情境（例如：雨天窗邊的一杯阿里山手沖配上剛出爐的法棍...）"
                 value={socialInput}
                 onChange={(e) => setSocialInput(e.target.value)}
               />
               <button 
                 onClick={handleSocialGen}
                 className="bg-[#3f6212] text-white px-6 py-3 rounded-xl hover:bg-[#2d460d] w-full md:w-auto"
               >
                 ✨ 生成文案
               </button>
             </div>
             {socialResult && (
               <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#3f6212] animate-slide-up">
                 <pre className="whitespace-pre-wrap font-sans text-gray-700">{socialResult}</pre>
                 <button 
                   onClick={() => navigator.clipboard.writeText(socialResult)}
                   className="mt-4 text-sm text-[#b45309] flex items-center gap-1 hover:underline"
                 >
                   <Copy size={14}/> 複製內容
                 </button>
               </div>
             )}
             {renderHistoryList('social')}
          </div>
        )}

        {/* --- Tab: Feedback (OWNER) --- */}
        {!loading && activeTab === 'feedback' && !isGuest && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold font-serif text-[#3f6212]">顧客評論分析</h2>
             <textarea
               className="w-full p-4 rounded-xl border border-gray-200 shadow-sm"
               rows={5}
               placeholder="在此貼上最近的 Google 評論內容..."
               value={reviewsInput}
               onChange={(e) => setReviewsInput(e.target.value)}
             />
             <button 
               onClick={handleReviewAnalysis}
               className="bg-[#3f6212] text-white px-6 py-3 rounded-xl hover:bg-[#2d460d]"
             >
               分析獲利機會與服務缺口
             </button>
             
             {reviewAnalysis && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-fade-in">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h4 className="font-bold text-gray-500 text-sm uppercase mb-2">情緒指數</h4>
                   <p className="text-xl text-[#3f6212]">{reviewAnalysis.sentiment}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h4 className="font-bold text-[#b45309] text-sm uppercase mb-2">獲利機會</h4>
                   <p className="text-lg">{reviewAnalysis.profitInsight}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-400">
                   <h4 className="font-bold text-red-600 text-sm uppercase mb-2">服務缺口</h4>
                   <p className="text-lg">{reviewAnalysis.efficiencyGap}</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <h4 className="font-bold text-gray-500 text-sm uppercase mb-2">AI 總結</h4>
                   <p className="text-gray-700">{reviewAnalysis.summary}</p>
                 </div>
               </div>
             )}
             {renderHistoryList('feedback')}
          </div>
        )}

        {/* --- Tab: Product (OWNER) --- */}
        {!loading && activeTab === 'product' && !isGuest && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-serif text-[#3f6212]">新品研發室</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="輸入靈感（例如：草莓塔、鹹蛋黃巴斯克）"
                className="flex-1 p-3 rounded-xl border border-gray-300 shadow-sm"
                value={productIdea}
                onChange={(e) => setProductIdea(e.target.value)}
              />
              <button 
                onClick={handleNewProduct}
                className="bg-[#3f6212] text-white px-8 py-3 rounded-xl hover:bg-[#2d460d]"
              >
                生成配方
              </button>
            </div>

            {productResult && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col md:flex-row animate-fade-in mt-6">
                <div className="md:w-1/3 bg-gray-100 min-h-[300px] relative">
                  {productImage ? (
                    <img src={productImage} alt="Generated Food" className="w-full h-full object-cover" />
                  ) : (
                     <div className="flex items-center justify-center h-full text-gray-400">正在繪製示意圖...</div>
                  )}
                </div>
                <div className="p-8 md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-[#78350f]">{productResult.name}</h3>
                      <div className="bg-[#b45309] text-white text-xs px-2 py-1 rounded">AI 推薦</div>
                  </div>
                  
                  {/* Analysis Charts */}
                  {productResult.analysis && (
                      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                          {renderBar("成本控制", productResult.analysis.costScore, "bg-red-400")}
                          {renderBar("製作難度", productResult.analysis.difficultyScore, "bg-blue-400")}
                          {renderBar("吸睛程度", productResult.analysis.instagrammableScore, "bg-pink-400")}
                          {renderBar("預期利潤", productResult.analysis.marginScore, "bg-green-500")}
                      </div>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">配方策略</h4>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{productResult.recipe}</p>
                  </div>
                  <div className="bg-[#ecfccb]/50 p-6 rounded-xl border border-[#ecfccb]">
                     <h4 className="text-xs font-bold text-[#3f6212] uppercase tracking-widest mb-2">定價邏輯</h4>
                     <p className="text-[#3f6212] font-medium text-lg">{productResult.pricingStrategy}</p>
                  </div>
                </div>
              </div>
            )}
            {renderHistoryList('product')}
          </div>
        )}

        {/* --- Tabs: Menu & Revenue (Dual Mode) --- */}
        {!loading && (activeTab === 'menu' || activeTab === 'revenue') && (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold font-serif ${isGuest ? 'text-stone-700' : 'text-[#3f6212]'}`}>
              {activeTab === 'menu' ? (isGuest ? 'Woosh Cafe Menu' : '菜單獲利工程') : '營收預測分析'}
            </h2>

            {/* Guest View for Menu (Updated Mobile Friendly) */}
            {isGuest && activeTab === 'menu' && (
                <div className="animate-fade-in relative pb-24">
                    {/* Category Filter Pills */}
                    <div className="sticky top-0 bg-stone-50 z-10 py-2 -mx-4 px-4 overflow-x-auto no-scrollbar flex gap-2">
                        {['all', 'coffee', 'milk_tea', 'food', 'dessert'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setMenuCategory(cat)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                                    menuCategory === cat 
                                    ? 'bg-stone-800 text-white' 
                                    : 'bg-white text-stone-500 border border-stone-200'
                                }`}
                            >
                                {CATEGORY_MAP[cat]}
                            </button>
                        ))}
                    </div>

                    {/* Featured Item (Only when 'all' is selected) */}
                    {menuCategory === 'all' && (
                        <div className="mt-4 mb-6 bg-white p-6 rounded-2xl text-center shadow-sm border border-stone-100">
                            <p className="text-stone-500 font-serif italic mb-2">Welcome to Woosh Cafe</p>
                            <h3 className="text-2xl font-bold text-stone-800 mb-4">今日推薦組合</h3>
                            <div className="inline-block bg-white border-2 border-[#b45309] text-[#b45309] px-6 py-4 rounded-xl shadow-lg transform active:scale-95 transition-transform cursor-pointer">
                                <div className="text-sm font-bold uppercase tracking-wider mb-1">Golden Combo</div>
                                <div className="text-xl font-bold">黑豚火腿法棍 + 阿里山手沖</div>
                                <div className="mt-2 text-stone-500 line-through text-sm">$650</div>
                                <div className="text-2xl font-bold text-[#b45309]">$620</div>
                                <p className="text-xs text-stone-400 mt-2">請向店長出示此畫面點餐</p>
                            </div>
                        </div>
                    )}

                    {/* Category Grouped Lists */}
                    {['coffee', 'milk_tea', 'food', 'dessert'].map(cat => {
                        if (menuCategory !== 'all' && menuCategory !== cat) return null;
                        const items = MENU_DATA.filter(i => i.category === cat);
                        if (items.length === 0) return null;

                        return (
                            <div key={cat} className="mb-8">
                                <h3 className="text-xl font-bold text-stone-700 mb-4 sticky top-12 bg-stone-50/95 py-2 z-9 backdrop-blur-sm">
                                    {CATEGORY_MAP[cat]}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {items.map((item, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-stone-800">{item.name}</h4>
                                                <p className="text-stone-500 font-mono mt-1">${item.price}</p>
                                            </div>
                                            <button 
                                                onClick={() => addToCart(item)}
                                                className="bg-stone-100 hover:bg-stone-200 text-stone-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    
                    {/* Guest Cart Floating Button */}
                    {cart.length > 0 && (
                        <div className="fixed bottom-20 md:bottom-8 left-4 right-4 z-40">
                             <button 
                                onClick={() => setShowCartModal(true)}
                                className="w-full bg-stone-800 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center animate-slide-up"
                             >
                                 <div className="flex items-center gap-2">
                                     <div className="bg-[#b45309] text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">
                                         {cart.reduce((sum, i) => sum + i.quantity, 0)}
                                     </div>
                                     <span className="font-bold">查看購物車</span>
                                 </div>
                                 <span className="font-mono text-lg">${calculateCartTotal()}</span>
                             </button>
                        </div>
                    )}

                    {/* Guest Cart Modal */}
                    {showCartModal && (
                        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in p-0 md:p-4">
                            <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up">
                                <div className="p-4 border-b flex justify-between items-center">
                                    <h3 className="font-bold text-lg">您的點餐內容</h3>
                                    <button onClick={() => setShowCartModal(false)} className="p-2 text-stone-400 hover:text-stone-600">
                                        <ChevronRight className="rotate-90" />
                                    </button>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                                    {cart.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-sm">{item.name}</div>
                                                <div className="text-stone-500 text-xs">${item.price}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => removeFromCart(item.name)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t bg-stone-50 rounded-b-2xl">
                                    <div className="flex justify-between mb-4 text-lg font-bold">
                                        <span>總金額</span>
                                        <span>${calculateCartTotal()}</span>
                                    </div>
                                    <button 
                                        onClick={submitOrder}
                                        className="w-full bg-[#b45309] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#92400e] transition-transform active:scale-95"
                                    >
                                        送單至櫃台
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Order Success Message */}
                    {orderSuccess && (
                        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-stone-800 text-white px-6 py-4 rounded-2xl shadow-xl z-50 flex items-center gap-3 animate-fade-in">
                            <CheckCircle className="text-green-400" />
                            <div>
                                <div className="font-bold">訂單已送出！</div>
                                <div className="text-xs text-stone-400">請稍候，我們將為您準備餐點</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Owner View for Revenue & Menu Analysis */}
            {!isGuest && (
                <>
                {/* Visualized Charts for Revenue */}
                {activeTab === 'revenue' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Real-time Stats from Orders */}
                        {(() => {
                           const { totalRevenue, totalOrders, sortedItems } = getRevenueStats();
                           return (
                             <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#3f6212] p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between">
                                        <div>
                                            <p className="opacity-80 text-sm flex items-center gap-2"><DollarSign size={16}/> 即時總營收</p>
                                            <p className="text-4xl font-bold mt-2 font-mono">${totalRevenue.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-[#ecfccb] mt-4">
                                            <CheckCircle size={16} />
                                            <span className="font-bold">{totalOrders} 筆訂單</span>
                                            <span className="opacity-80 text-sm">(已完成)</span>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-gray-500 text-sm font-bold mb-4 flex items-center gap-2"><Target size={16}/> 熱銷排行分析</h3>
                                        <div className="space-y-3 max-h-40 overflow-y-auto">
                                            {sortedItems.length > 0 ? sortedItems.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-[#b45309] text-white' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                                                        {item.name}
                                                    </span>
                                                    <span className="font-bold text-[#3f6212]">{item.count} 份</span>
                                                </div>
                                            )) : (
                                                <p className="text-gray-400 text-center py-4">尚無銷售數據，請先完成訂單</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                             </>
                           );
                        })()}

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-500 text-sm font-bold mb-4">週營收趨勢 (Visualized)</h3>
                            <div className="flex items-end justify-between h-32 gap-2">
                                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                    <div key={i} className="w-full bg-[#ecfccb] rounded-t-lg relative group transition-all hover:bg-[#b45309]" style={{ height: `${h}%` }}>
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                                            ${h * 100}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* CSV Upload for Owner */}
                {!isGuest && (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50 hover:bg-white transition-colors cursor-pointer relative group mt-8">
                    <input 
                        type="file" 
                        accept=".csv" 
                        onChange={(e) => handleFileUpload(e, activeTab as 'menu' | 'revenue')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="group-hover:scale-110 transition-transform duration-300">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    </div>
                    <p className="text-gray-500 font-medium">將 POS 或營收 CSV 報表拖拉至此</p>
                    <p className="text-xs text-gray-400 mt-1">AI 將分析利潤結構與人力成本分數</p>
                    </div>
                )}

                {csvAnalysis && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3f6212]/10 animate-fade-in mt-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#3f6212]">
                    <Target size={20}/> AI 分析報告
                    </h3>
                    <div className="prose prose-stone max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{csvAnalysis}</pre>
                    </div>
                </div>
                )}
                
                {renderHistoryList('csv')}

                {/* Owner Menu View: Tabs + Table (Updated) */}
                {activeTab === 'menu' && (
                    <div className="space-y-6 mt-6">
                        {/* 1. Category Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {['all', 'coffee', 'milk_tea', 'food', 'dessert'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setMenuCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                        menuCategory === cat
                                            ? 'bg-[#3f6212] text-white border-[#3f6212]'
                                            : 'bg-white text-[#3f6212] border-[#3f6212]/30 hover:bg-[#ecfccb]'
                                    }`}
                                >
                                    {CATEGORY_MAP[cat]}
                                </button>
                            ))}
                        </div>

                        {/* 2. Filtered Table */}
                        <div className="animate-fade-in">
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 overflow-x-auto">
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="bg-[#fdfbf7] text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 whitespace-nowrap text-sm">品項</th>
                                            <th className="p-4 whitespace-nowrap text-sm">價格</th>
                                            <th className="p-4 whitespace-nowrap text-sm">利潤等級</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(menuCategory === 'all' 
                                            ? MENU_DATA 
                                            : MENU_DATA.filter(i => i.category === menuCategory)
                                        ).map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 font-medium text-[#78350f]">
                                                    {item.name}
                                                    <span className="block text-xs text-gray-400 mt-1">{CATEGORY_MAP[item.category]}</span>
                                                </td>
                                                <td className="p-4 font-mono text-gray-600">${item.price}</td>
                                                <td className="p-4">
                                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                                        item.margin === 'high' ? 'bg-green-100 text-green-800' :
                                                        item.margin === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {item.margin === 'high' ? '高毛利 (High)' : 
                                                         item.margin === 'medium' ? '中毛利 (Med)' : '低毛利 (Low)'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(menuCategory !== 'all' && MENU_DATA.filter(i => i.category === menuCategory).length === 0) && (
                                    <div className="p-8 text-center text-gray-400">此類別尚無資料</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                </>
            )}
          </div>
        )}

        {/* --- Tab: KPI --- */}
        {!loading && activeTab === 'kpi' && !isGuest && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-serif text-[#3f6212]">年度目標追蹤</h2>
                 <button 
                   onClick={() => exportToCSV(`KPI Report\nRevenue Goal,${kpiRevenue}\nCustomer Goal,${kpiCustomers}\nTicket Goal,${kpiTicket}`, 'kpi_report.csv')}
                   className="flex items-center gap-2 bg-[#78350f] text-white px-4 py-2 rounded-lg hover:bg-[#5a270b] transition"
                 >
                    <Download size={18} /> 匯出總報表 (CSV)
                 </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Revenue KPI */}
                 <div className="bg-white p-6 rounded-3xl shadow-lg text-center border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#ecfccb]"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">營收目標 (Revenue)</p>
                    <input 
                        type="number" 
                        value={kpiRevenue} 
                        onChange={(e) => setKpiRevenue(Number(e.target.value))}
                        className="text-3xl font-bold text-[#3f6212] mb-2 text-center w-full bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-[#3f6212]"
                    />
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-[#b45309] h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">達成率 65%</span>
                 </div>

                 {/* Customer Count KPI */}
                 <div className="bg-white p-6 rounded-3xl shadow-lg text-center border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-200"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">年度來客數 (Customers)</p>
                    <input 
                        type="number" 
                        value={kpiCustomers} 
                        onChange={(e) => setKpiCustomers(Number(e.target.value))}
                        className="text-3xl font-bold text-blue-800 mb-2 text-center w-full bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-blue-800"
                    />
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">達成率 45%</span>
                 </div>

                 {/* Avg Ticket KPI */}
                 <div className="bg-white p-6 rounded-3xl shadow-lg text-center border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-purple-200"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">平均客單價 (Ticket)</p>
                    <input 
                        type="number" 
                        value={kpiTicket} 
                        onChange={(e) => setKpiTicket(Number(e.target.value))}
                        className="text-3xl font-bold text-purple-800 mb-2 text-center w-full bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-purple-800"
                    />
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">目前 $280 (80%)</span>
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <div className="bg-[#ecfccb] p-6 rounded-2xl border border-[#3f6212]/20">
                    <h3 className="font-bold text-[#3f6212] mb-2 flex items-center gap-2"><Target size={18}/> 策略筆記</h3>
                    <p className="text-[#3f6212]/80 leading-relaxed">為了提升客單價至 ${kpiTicket}，請店員在結帳時主動詢問「是否加購長棍切片 ($40)」，預計可提升 15% 附加率。</p>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
                     <div>
                         <h3 className="font-bold text-gray-500 text-sm">與去年同期比較 (YoY)</h3>
                         <p className="text-3xl font-bold text-[#78350f]">+12.5%</p>
                     </div>
                     <BarChart3 className="text-gray-300 h-16 w-16" />
                 </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};