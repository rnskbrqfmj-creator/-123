import { GoogleGenerativeAI } from "@google/generative-ai"; // 修正 import 名稱
import { SYSTEM_INSTRUCTION, PROMPT_TEMPLATES } from "../constants";
import { DailyInsight, FeedbackAnalysis, ProductRecipe } from "../types";

// Vite 環境變數規範
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const TEXT_MODEL_ID = 'gemini-1.5-flash';
const IMAGE_MODEL_ID = 'gemini-1.5-flash';

// 檢查 Key 是否存在，避免白畫面
if (!API_KEY) {
  console.warn("警告：API Key 未設定，AI 功能將無法運作。");
}

// Basic text generation
export const generateResponse = async (prompt: string, options?: { useSearch?: boolean }): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: TEXT_MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "無法產生回應，請稍後再試。";
  } catch (error: any) {
    // 捕捉額度用盡錯誤
    if (error.message?.includes('429')) {
      return "今日 AI 額度已用盡，請明天再試或聯繫管理員。";
    }
    console.error("Gemini API Error:", error);
    return "發生錯誤，請檢查網路連線或金鑰設定。";
  }
};

const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export const getDailyFocus = async (): Promise<DailyInsight> => {
    const today = new Date().toLocaleDateString('zh-TW');
    const prompt = PROMPT_TEMPLATES.daily(today);
    const raw = await generateResponse(prompt);
    try {
      return JSON.parse(cleanJson(raw));
    } catch (e) {
      return { focus: "無法解析數據", tasks: [], suggestion: "請重新整理再試" };
    }
};

// ... 其餘 specialized wrappers 維持原樣，但確保呼叫 generateResponse
