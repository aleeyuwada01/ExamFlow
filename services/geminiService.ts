
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, ExamSection, Difficulty, BloomsLevel, ExamPaper, UsageLog } from "../types";
import { trackAIUsage, getSystemConfig, getCurrentUser, deductToken, getBalance } from "./storageService";

// Helper to get fresh AI instance with current Master Key
const getAI = () => {
    const config = getSystemConfig();
    const apiKey = config.gemini_api_key || process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not configured. Please contact admin.");
    return new GoogleGenAI({ apiKey });
};

const MODEL_PRO = "gemini-3-pro-preview";
const MODEL_FLASH = "gemini-3-flash-preview";

const checkLimit = () => {
    const user = getCurrentUser();
    if (!user) throw new Error("User session expired.");
    
    // Deduct token for AI operation
    const hasToken = deductToken(user.id, 1);
    if (!hasToken) {
        throw new Error("Insufficient AI Tokens. Please top-up or switch your plan to continue using AI features.");
    }
};

const logUsage = (feature: UsageLog['feature'], model: string) => {
    const user = getCurrentUser();
    if (user) trackAIUsage(user.id, user.school_id, feature, model);
};

const examSectionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      instructions: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["OBJ", "FILL", "THEORY"] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_answer: { type: Type.STRING },
            marks: { type: Type.NUMBER },
          },
          required: ["text", "type"],
        },
      },
    },
    required: ["title", "questions"],
  },
};

export const generateQuestionsFromAI = async (
  subject: string, topic: string, difficulty: string, qType: string, count: number, lessonPlan?: string
): Promise<ExamSection[]> => {
  checkLimit();
  try {
    const ai = getAI();
    logUsage('GENERATION', MODEL_PRO);

    let prompt = `Professional Teacher (Nigeria). Create ${count} questions (Subject: ${subject}, Topic: ${topic}, Difficulty: ${difficulty}, Type: ${qType}). Cultural Context: Nigeria.`;
    if (lessonPlan) prompt += ` Specific context: ${lessonPlan}`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema,
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      return data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        questions: section.questions.map((q: any) => ({ ...q, id: crypto.randomUUID() })),
      }));
    }
    throw new Error("Empty response");
  } catch (error: any) {
    console.error(error); throw error;
  }
};

export const ocrFromImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<ExamSection[]> => {
  checkLimit();
  try {
    const ai = getAI();
    logUsage('OCR', MODEL_PRO);

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Convert handwritten exam image to structured JSON sections." }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema,
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      return data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        questions: section.questions.map((q: any) => ({ ...q, id: crypto.randomUUID() })),
      }));
    }
    throw new Error("OCR Failed");
  } catch (error: any) {
    console.error(error); throw error;
  }
};

export const refineQuestionText = async (text: string, instruction: string): Promise<string> => {
    checkLimit();
    const ai = getAI();
    logUsage('REFINEMENT', MODEL_FLASH);
    const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `${instruction}: ${text}`
    });
    return response.text || text;
};

export const analyzeQuestionMetadata = async (text: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Analyze difficulty/Bloom level for: ${text}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    difficulty: { type: Type.STRING },
                    bloomsLevel: { type: Type.STRING }
                }
            }
        }
    });
    return response.text ? JSON.parse(response.text) : { difficulty: 'Medium', bloomsLevel: 'Understand' };
};

export const spinQuestion = async (text: string) => {
    checkLimit();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_FLASH,
        contents: `Rewrite: ${text}`
    });
    return response.text || text;
};

export const improveDistractors = async (text: string, options: string[]) => {
    checkLimit();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: `Better options for MC Question: ${text}. Current: ${options.join(',')}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return response.text ? JSON.parse(response.text) : options;
};

export const generateRubric = async (text: string) => {
    checkLimit();
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: `Marking guide for: ${text}`
    });
    return response.text || "";
};

export const runComplianceCheck = async (paper: ExamPaper) => {
    checkLimit();
    const ai = getAI();
    logUsage('COMPLIANCE', MODEL_PRO);
    const response = await ai.models.generateContent({
        model: MODEL_PRO,
        contents: `Evaluate Nigerian compliance: ${JSON.stringify(paper.sections)}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                },
                required: ["score", "feedback"]
            }
        }
    });
    return response.text ? JSON.parse(response.text) : { score: 0, feedback: "Error" };
};
