import { GoogleGenAI } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const getRamadanMotivation = async (userName: string, points: number) => {
  const ai = getAI();
  if (!ai) return "রমজান মোবারক! আপনার আমল জারি রাখুন।";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a very short, inspiring Quranic verse or a short Hadith in Bengali with its reference. The user ${userName} is tracking their Ramadan deeds and has earned ${points} points. Keep it under 100 characters if possible. Output ONLY the text and reference. Do not repeat the same one if possible.`,
    });
    return response.text || "রমজান মোবারক! আপনার আমল জারি রাখুন।";
  } catch (error) {
    return "রমজান মোবারক! আপনার আমল জারি রাখুন।";
  }
};

export const getQuizQuestions = async (count: number = 10) => {
  const ai = getAI();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} unique Islamic quiz questions in Bengali. Each question should have 4 options, the correct answer index (0-3), and a short explanation for the correct answer. Format as a JSON array of objects: [{question, options, correctIndex, explanation}, ...]`,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to fetch quiz questions", error);
    return [];
  }
};
