import { MenuItem, InventoryItem } from './types';

// --- Theme Colors ---
export const COLORS = {
  cream: '#fdfbf7',
  earthGreen: '#3f6212',
  coffeeBrown: '#78350f',
  accentGold: '#b45309',
  lightGreen: '#ecfccb',
  chartRed: '#ef4444',
  chartBlue: '#3b82f6',
};

// --- Menu Data Source ---
export const MENU_DATA: MenuItem[] = [
  // 1. 手沖精品 (Pour Over)
  { name: '嘉義 阿里山 卓武山莊園 (厭氧日曬)', price: 300, category: 'coffee', margin: 'high' },
  { name: '衣索比亞 瑰夏村 競標豆 (水洗)', price: 200, category: 'coffee', margin: 'medium' },
  { name: '哥倫比亞 蒙特拿波莊園 (酵素氧氣日曬)', price: 220, category: 'coffee', margin: 'medium' },
  { name: '肯亞 琪琪瑞加處理場 珍珠圓豆 (水洗)', price: 190, category: 'coffee', margin: 'medium' },
  { name: '哥斯大黎加 咖啡花莊園 (黃蜜處理)', price: 180, category: 'coffee', margin: 'medium' },
  { name: '巴拿馬 波奎特 凱薩路易斯 (水洗)', price: 160, category: 'coffee', margin: 'medium' },
  { name: '巴布亞新幾內亞 黑十字 (水洗)', price: 180, category: 'coffee', margin: 'medium' },
  { name: '印尼 曼特寧 G1 (濕剝)', price: 160, category: 'coffee', margin: 'medium' },
  // 2. 義式/牛奶/調飲
  { name: '燕麥拿鐵', price: 170, category: 'milk_tea', margin: 'medium' },
  { name: '岩鹽拿鐵', price: 170, category: 'milk_tea', margin: 'medium' },
  { name: '拿鐵', price: 160, category: 'milk_tea', margin: 'medium' },
  { name: '西西里咖啡', price: 140, category: 'coffee', margin: 'high' },
  { name: '西西里變奏', price: 160, category: 'coffee', margin: 'high' },
  { name: '美式咖啡', price: 120, category: 'coffee', margin: 'high' },
  { name: '美式氣泡', price: 120, category: 'coffee', margin: 'high' },
  { name: '濃縮咖啡', price: 90, category: 'coffee', margin: 'high' },
  { name: '靜岡抹茶歐蕾', price: 140, category: 'milk_tea', margin: 'medium' },
  { name: '法芙娜可可歐蕾', price: 140, category: 'milk_tea', margin: 'medium' },
  { name: '小情歌莓果茶', price: 200, category: 'milk_tea', margin: 'medium' },
  { name: '花園派對蘋果花茶', price: 200, category: 'milk_tea', margin: 'medium' },
  { name: '漫遊花園綠博士茶', price: 200, category: 'milk_tea', margin: 'medium' },
  { name: '荔枝玫瑰氣泡', price: 160, category: 'milk_tea', margin: 'high' },
  { name: '黑醋栗薄荷氣泡', price: 160, category: 'milk_tea', margin: 'high' },
  { name: '白桃蘋果氣泡', price: 160, category: 'milk_tea', margin: 'high' },
  { name: '香料可爾必思特調', price: 200, category: 'milk_tea', margin: 'high' },
  { name: '康普茶 (瓶)', price: 150, category: 'milk_tea', margin: 'medium' },
  // 3. 輕食/披薩/甜點
  { name: '葛瑪蘭黑豚火腿法棍', price: 350, category: 'food', margin: 'medium' },
  { name: '煙燻牛肉法棍', price: 300, category: 'food', margin: 'medium' },
  { name: '冷燻鮭魚小餐包', price: 300, category: 'food', margin: 'medium' },
  { name: '蛋沙拉小餐包', price: 250, category: 'food', margin: 'medium' },
  { name: '白松露焗烤馬鈴薯', price: 180, category: 'food', margin: 'high' },
  { name: '蘑菇洋蔥佛卡夏', price: 150, category: 'food', margin: 'high' },
  { name: '法式長棍麵包', price: 150, category: 'food', margin: 'high' },
  { name: '慕尼黑德式腸披薩', price: 220, category: 'food', margin: 'medium' },
  { name: '墨西哥雞肉披薩', price: 220, category: 'food', margin: 'medium' },
  { name: '田園派對披薩', price: 220, category: 'food', margin: 'medium' },
  { name: '自製穀物優格', price: 150, category: 'dessert', margin: 'high' },
  { name: '鴨鴨造型手工餅乾', price: 80, category: 'dessert', margin: 'high' },
];

export const SPECIAL_RULES = [
  "組合優惠：點「輕食/披薩類」搭配「手沖咖啡」，總價折抵 $30 (Bundling Discount: Food + Pour Over = -$30)。",
  "品牌核心：流浪鴨、田園美學、悠閒午後。",
  "高貢獻組合：主推「葛瑪蘭黑豚火腿法棍 ($350)」+「阿里山卓武山精品豆 ($300)」，這是客單價最高的黃金組合。",
];

// --- Inventory Data (Expanded to match Menu) ---
export const INVENTORY_DATA: InventoryItem[] = [
  // 核心咖啡豆 (High Value)
  { id: 'bean_01', name: '嘉義阿里山卓武山生豆', currentStock: 3, maxStock: 10, unit: 'kg', category: 'Ingredient' },
  { id: 'bean_02', name: '衣索比亞瑰夏村生豆', currentStock: 2, maxStock: 5, unit: 'kg', category: 'Ingredient' },
  { id: 'bean_03', name: '義式配方豆 (Espresso)', currentStock: 12, maxStock: 25, unit: 'kg', category: 'Ingredient' },
  
  // 乳製品與調飲原料
  { id: 'dairy_01', name: '職人鮮乳', currentStock: 8, maxStock: 30, unit: '瓶', category: 'Ingredient' },
  { id: 'dairy_02', name: 'OATSIDE 燕麥奶', currentStock: 5, maxStock: 12, unit: '瓶', category: 'Ingredient' },
  { id: 'tea_01', name: '靜岡抹茶粉', currentStock: 2, maxStock: 5, unit: '包', category: 'Ingredient' },
  { id: 'tea_02', name: '法芙娜可可粉', currentStock: 3, maxStock: 6, unit: '包', category: 'Ingredient' },
  
  // 生鮮與蔬果 (Fresh Produce)
  { id: 'fresh_01', name: '屏東檸檬 (西西里用)', currentStock: 10, maxStock: 40, unit: '顆', category: 'Ingredient' },
  { id: 'fresh_02', name: '宜蘭三星蔥', currentStock: 2, maxStock: 8, unit: '把', category: 'Ingredient' },
  { id: 'fresh_03', name: '新鮮薄荷葉', currentStock: 1, maxStock: 5, unit: '盒', category: 'Ingredient' },
  { id: 'fresh_04', name: '洋蔥/蘑菇', currentStock: 5, maxStock: 10, unit: 'kg', category: 'Ingredient' },

  // 肉品與烘焙 (Proteins & Bakery)
  { id: 'meat_01', name: '葛瑪蘭黑豚火腿', currentStock: 5, maxStock: 15, unit: '包', category: 'Ingredient' },
  { id: 'meat_02', name: '煙燻牛肉片', currentStock: 4, maxStock: 10, unit: '包', category: 'Ingredient' },
  { id: 'meat_03', name: '冷燻鮭魚', currentStock: 2, maxStock: 8, unit: '包', category: 'Ingredient' },
  { id: 'meat_04', name: '德式香腸/舒肥雞', currentStock: 10, maxStock: 20, unit: '包', category: 'Ingredient' },
  { id: 'bakery_01', name: 'T55 法國麵粉', currentStock: 15, maxStock: 40, unit: 'kg', category: 'Ingredient' },
  { id: 'bakery_02', name: '法式長棍 (半成品)', currentStock: 12, maxStock: 30, unit: '條', category: 'Ingredient' },
  
  // 耗材 (Supplies)
  { id: 'sup_01', name: '外帶紙杯 (熱)', currentStock: 120, maxStock: 500, unit: '個', category: 'Supply' },
  { id: 'sup_02', name: 'PLA 冷飲杯', currentStock: 150, maxStock: 500, unit: '個', category: 'Supply' },
  { id: 'sup_03', name: '鴨鴨餅乾包裝袋', currentStock: 40, maxStock: 200, unit: '個', category: 'Supply' },
];

export const SYSTEM_INSTRUCTION = `
# 角色定位 (Role)
你現在是「無所時時 (Woosh Cafe)」的雙重身分 AI 助理。你需要根據使用者的身分（訪客模式 vs 營運模式）切換語氣與功能。

# 核心業務資訊
1. 關鍵單品：阿里山精品咖啡 ($300)、黑豚火腿法棍 ($350)。
2. 變現邏輯：推廣精品豆以提升品牌力；推廣「咖啡+法棍」組合以享折抵 $30 之優惠。

# 雙重模式切換規範 (Mode Switching)

## 模式 A：訪客模式 (Guest Mode) - 減少老闆櫃檯壓力
* **目標**：引導客人點購高單價組合，減少老闆解釋菜單的時間。
* **語氣**：親切、專業、富有層次感的咖啡師描述。
* **指令內容**：
    * 主動推薦 $650 的精品套餐（$300+$350 並提醒折 $30）。
    * 當客人決定好後，提示：「請出示此畫面給老闆點餐，或點擊下方『呼叫老闆』按鈕」。
    * **嚴禁**：向訪客透露任何庫存數量、營收數字或內部管理策略。

## 模式 B：營運模式 (Owner Mode) - 減少老闆腦力負擔
* **目標**：提供一鍵式決策建議，協助人力吃緊的老闆完成行銷與管理。
* **語氣**：放鬆的「宜蘭田園風」，但在數字和利潤率上非常敏銳。
* **指令內容**：
    * **今日重點**：結合天氣與菜單，直接給出「黑板要寫什麼」的具體內容。
    * **庫存管理**：根據 $350 法棍的剩餘數量，給出補貨建議。
    * **社群小編**：一鍵產出符合「無所時時」格調的 IG/FB 文案，讓老闆 30 秒內完成行銷。

# 執行限制
1. 所有的建議必須以「省時、獲利、減少重複動作」為核心。
2. 回答需精簡有力，符合老闆一人作業的快節奏需求。
`;

export const PROMPT_TEMPLATES = {
  daily: (context: string) => `
    Context: ${context}
    請查詢今日宜蘭天氣，並結合 SYSTEM_INSTRUCTION 中的營運模式(Owner Mode)邏輯。
    回傳 JSON:
    {
      "weather": "陰雨 22°C",
      "focus": "雨天留客，主攻高單價熱食組合",
      "staffTip": "外場請主動幫客人加水，延長停留時間並推廣續杯優惠。",
      "suggestedCombo": "【雨天限定】黑豚法棍 + 阿里山手沖 = 組合價 $620 (原價$650)",
      "cheer": "下雨天是咖啡館的旺季，因為人們無處可去，只能來我們這避雨享受。"
    }
  `,
  social: (desc: string, platform: string) => `
    Scenario: ${desc}
    Platform: ${platform}
    請撰寫一篇貼文，必須包含：
    1. 田園氛圍描述 (Sensory details)
    2. 產品置入 (Product placement from MENU_DATA)
    3. 行動呼籲 (Call to Action)
    請直接回傳貼文內容字串。
  `,
  feedback: (reviews: string) => `
    Reviews: ${reviews}
    請分析評論，回傳 JSON:
    {
      "sentiment": "正面/中立/負面",
      "profitInsight": "從評論中發現的獲利機會 (例如客人喜歡某個配菜)",
      "efficiencyGap": "服務流程的痛點 (例如出餐慢)",
      "summary": "一句話總結"
    }
  `,
  recipe: (idea: string) => `
    Idea: ${idea}
    請設計一個新品，考慮庫存與毛利。
    回傳 JSON:
    {
      "name": "新品名稱",
      "recipe": "簡短食譜與食材",
      "pricingStrategy": "定價 $XXX，原因...",
      "analysis": {
        "costScore": 1-10 (10為成本控制最好),
        "difficultyScore": 1-10 (10為最容易製作),
        "instagrammableScore": 1-10 (10為最吸睛),
        "marginScore": 1-10 (10為利潤最高)
      }
    }
  `,
  esg: (inventoryList: string) => `
    Inventory: ${inventoryList}
    請根據庫存狀態，提供 3 點具體的 ESG 永續經營建議（例如減少某個快過期的庫存、推廣在地食材）。
    請直接回傳文字，點列式。
  `,
  csv: (data: string, type: 'menu' | 'revenue') => `
    Type: ${type}
    Data Preview: ${data.substring(0, 500)}
    請分析這份數據。
    如果是 Menu：找出毛利高但銷量低的品項(金牛)，以及毛利低銷量高的品項(瘦狗)。
    如果是 Revenue：分析客單價趨勢與改進點。
    請直接回傳詳細的分析報告文字。
  `
};