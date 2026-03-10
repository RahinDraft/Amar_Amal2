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
      contents: `Provide a very short, inspiring Quranic verse or a short Hadith in Bengali with its reference. The user ${userName} is tracking their Ramadan deeds. Keep it under 100 characters if possible. Output ONLY the text and reference.`,
    });
    return response.text || "রমজান মোবারক! আপনার আমল জারি রাখুন।";
  } catch (error) {
    return "রমজান মোবারক! আপনার আমল জারি রাখুন।";
  }
};

export const getQuizQuestion = async () => {
  const ai = getAI();
  if (!ai) return {
    question: "ইসলামের স্তম্ভ কয়টি?",
    options: ["৩টি", "৪টি", "৫টি", "৬টি"],
    correctIndex: 2
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a simple Islamic quiz question in Bengali with 4 options, the correct answer index (0-3), and a short explanation for the correct answer. Format as JSON: {question, options, correctIndex, explanation}",
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      question: "ইসলামের স্তম্ভ কয়টি?",
      options: ["৩টি", "৪টি", "৫টি", "৬টি"],
      correctIndex: 2
    };
  }
};
