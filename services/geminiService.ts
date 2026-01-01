import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, PROMPT_TEMPLATES } from "../constants";
import { DailyInsight, FeedbackAnalysis, ProductRecipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TEXT_MODEL_ID = 'gemini-3-flash-preview';
const IMAGE_MODEL_ID = 'gemini-2.5-flash-image';

interface GenerateOptions {
  useSearch?: boolean;
}

// Basic text generation
export const generateResponse = async (prompt: string, options?: GenerateOptions): Promise<string> => {
  try {
    const tools = options?.useSearch ? [{ googleSearch: {} }] : [];
    
    const response = await ai.models.generateContent({
      model: TEXT_MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        tools: tools,
      },
    });

    return response.text || "無法產生回應，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "發生錯誤，請檢查 API Key 或網路連線。";
  }
};

// Image generation
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_ID,
      contents: {
        parts: [
           { text: prompt } 
        ]
      },
      config: {
          // Default config
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

// --- Specialized Wrappers for UI Tools ---

const cleanJson = (text: string) => text.replace(/```json/g, '').replace(/```/g, '').trim();

export const getDailyFocus = async (): Promise<DailyInsight> => {
    const today = new Date().toLocaleDateString('zh-TW');
    const prompt = PROMPT_TEMPLATES.daily(today);
    const raw = await generateResponse(prompt, { useSearch: true });
    return JSON.parse(cleanJson(raw));
};

export const generateSocialPost = async (desc: string, platform: 'Instagram' | 'Threads') => {
    return await generateResponse(PROMPT_TEMPLATES.social(desc, platform));
};

export const analyzeReviews = async (reviews: string): Promise<FeedbackAnalysis> => {
    const raw = await generateResponse(PROMPT_TEMPLATES.feedback(reviews));
    return JSON.parse(cleanJson(raw));
};

export const generateProductRecipe = async (idea: string): Promise<ProductRecipe> => {
    const raw = await generateResponse(PROMPT_TEMPLATES.recipe(idea));
    return JSON.parse(cleanJson(raw));
};

export const generateProductImage = async (desc: string) => {
    return await generateImage(`High quality, appetizing food photography of: ${desc}. Style: Rustic cafe, natural light.`);
};

export const generateESGTips = async (inventoryList: string) => {
    return await generateResponse(PROMPT_TEMPLATES.esg(inventoryList));
};

export const analyzeCsvData = async (data: string, type: 'menu' | 'revenue') => {
    return await generateResponse(PROMPT_TEMPLATES.csv(data, type));
};