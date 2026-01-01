import { GoogleGenerativeAI } from "@google/generative-ai"; // 修正為正確的 SDK 名稱
import { SYSTEM_INSTRUCTION, PROMPT_TEMPLATES } from "../constants";
import { DailyInsight, FeedbackAnalysis, ProductRecipe } from "../types";

// Vite 環境變數必須以 VITE_ 開頭且使用 import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// 修正為穩定的模型 ID，避免 400 錯誤
const TEXT_MODEL_ID = 'gemini-1.5-flash';

interface GenerateOptions {
  useSearch?: boolean;
}

export const generateResponse = async (prompt: string, options?: GenerateOptions): Promise<string> => {
  try {
    // 檢查 API KEY 是否存在，防止白畫面
    if (!API_KEY) throw new Error("API Key 未設定");

    const model = genAI.getGenerativeModel({ 
      model: TEXT_MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "無法產生回應。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 捕捉額度耗盡錯誤
    if (error.message?.includes('429')) return "今日 AI 額度已用盡。";
    return "發生錯誤，請檢查 API Key 或網路連線。";
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
      return { focus: "分析失敗", tasks: [], suggestion: "請稍後再試" };
    }
};

// ...其餘導出函數維持邏輯一致，呼叫 generateResponse 即可
