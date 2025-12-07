
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, QuestionType, ExamSection, Difficulty, BloomsLevel, ExamPaper, ComplianceReport } from "../types";

// Using gemini-3-pro-preview as requested for high reasoning capabilities
const MODEL_NAME = "gemini-3-pro-preview";
const FAST_MODEL = "gemini-2.5-flash"; // For quick edits

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for structured output to ensure reliable parsing
const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["OBJ", "FILL", "THEORY"] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
    marks: { type: Type.NUMBER },
  },
  required: ["text", "type"],
};

const examSectionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      instructions: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: questionSchema,
      },
    },
    required: ["title", "questions"],
  },
};

export const generateQuestionsFromAI = async (
  subject: string,
  topic: string,
  difficulty: string,
  qType: string,
  count: number,
  lessonPlan?: string
): Promise<ExamSection[]> => {
  try {
    let prompt = `Act as a professional teacher in a Nigerian school. Create an exam section for Subject: ${subject}, Topic: ${topic}, Difficulty: ${difficulty}.
    
    Context:
    - The questions must strictly follow the Nigerian School Curriculum (UBE/WAEC/NECO standards).
    - Ensure cultural relevance to Nigeria where applicable (e.g., use Nigerian names like Emeka, Musa, Tolu, or local cities/context).
    - Language should be formal British English as used in Nigerian education.

    Generate ${count} questions of type ${qType}.
    If type is OBJ (Objective), provide 4 options (A-D) and the correct answer.`;

    if (lessonPlan) {
      prompt += `\n\nUse the following Teacher's Lesson Plan / Notes to tailor the questions specifically to what was taught:\n"${lessonPlan}"\n`;
    }

    prompt += `\nReturn the result as a list of sections (usually just one, but strict format).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema,
        thinkingConfig: { thinkingBudget: 2048 }, // Increased thinking budget for context integration
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Map to internal ID structure
      return data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        questions: section.questions.map((q: any) => ({
          ...q,
          id: crypto.randomUUID(),
        })),
      }));
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const ocrFromImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<ExamSection[]> => {
  try {
    const prompt = `Analyze this image of a handwritten exam. 
    1. Extract all questions.
    2. Correct any spelling or grammar errors (Standard British English).
    3. Categorize them into sections if apparent, otherwise create a "General" section.
    4. Determine the question type (OBJ, FILL, THEORY) automatically.
    5. Output strictly in the requested JSON format.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema,
         thinkingConfig: { thinkingBudget: 2048 }, // Higher budget for OCR analysis
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((section: any) => ({
        ...section,
        id: crypto.randomUUID(),
        questions: section.questions.map((q: any) => ({
          ...q,
          id: crypto.randomUUID(),
        })),
      }));
    }
    throw new Error("No data returned from OCR");
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

export const refineQuestionText = async (text: string, instruction: "FIX" | "REWRITE" | "MARKING"): Promise<string> => {
    // Simpler call for individual text edits
    const prompt = instruction === "FIX" ? `Fix formatting and spelling (British English/Nigerian Context): ${text}` :
                   instruction === "REWRITE" ? `Rewrite this question to be more clear, professional, and standard for Nigerian schools: ${text}` :
                   `Generate a brief marking scheme answer for: ${text}`;
    
    const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt
    });

    return response.text || text;
};

// --- Advanced AI Features ---

export const analyzeQuestionMetadata = async (text: string): Promise<{ difficulty: Difficulty, blooms: BloomsLevel }> => {
    const prompt = `Analyze this exam question: "${text}".
    Determine the Difficulty Level (Easy, Medium, Hard) and Bloom's Taxonomy Level (Remember, Understand, Apply, Analyze, Evaluate, Create).
    Return JSON format: { "difficulty": "Medium", "blooms": "Apply" }`;

    const response = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    if(response.text) {
        return JSON.parse(response.text);
    }
    return { difficulty: Difficulty.MEDIUM, blooms: BloomsLevel.REMEMBER };
};

export const spinQuestion = async (question: Question, mode: "HARDER" | "CONTEXT" | "TYPE_SWAP"): Promise<Question> => {
    let instruction = "";
    if (mode === "HARDER") instruction = "Rewrite this question to require higher-order thinking (Analyze/Evaluate).";
    if (mode === "CONTEXT") instruction = "Rewrite this question using Nigerian cultural context (names, places, food, scenarios).";
    if (mode === "TYPE_SWAP") instruction = question.type === QuestionType.OBJECTIVE ? "Convert this to a Fill-in-the-blank question." : "Convert this to a Multiple Choice question with 4 options.";

    const prompt = `Original Question: ${JSON.stringify(question)}.
    Instruction: ${instruction}
    Return the result in the exact same JSON structure as the original question (including type, options, etc.).`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: questionSchema 
        }
    });

    if(response.text) {
        const q = JSON.parse(response.text);
        return { ...question, ...q, id: question.id }; // Keep ID, update content
    }
    return question;
};

export const improveDistractors = async (question: Question): Promise<string[]> => {
    if (question.type !== QuestionType.OBJECTIVE || !question.options) return [];

    const prompt = `Analyze this multiple choice question: "${question.text}".
    Correct Answer: "${question.correctAnswer || 'Unknown'}".
    Current Options: ${JSON.stringify(question.options)}.
    
    Task: Generate 3 plausible but incorrect distractors based on common student misconceptions. 
    Return ONLY a JSON array of 4 strings (1 correct answer + 3 improved distractors). Ensure the correct answer is included.`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    if(response.text) {
        return JSON.parse(response.text);
    }
    return question.options || [];
};

export const generateRubric = async (question: Question): Promise<string> => {
    const prompt = `Generate a detailed marking rubric for this ${question.subject || 'General'} theory question: "${question.text}".
    Marks: ${question.marks}.
    Structure it with criteria and score bands.`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });

    return response.text || "No rubric generated.";
};

export const runComplianceCheck = async (paper: ExamPaper): Promise<ComplianceReport> => {
    const prompt = `Act as an Exam Officer. Audit this exam paper JSON against these rules:
    1. Must have clear instructions.
    2. Must be balanced in difficulty.
    3. Maximum 50 OBJ questions.
    4. Theory section must have at least 2 questions.
    
    Paper Data: ${JSON.stringify(paper.sections)}
    
    Return JSON: { "score": number (0-100), "issues": ["string"], "suggestions": ["string"] }`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    if(response.text) {
        return JSON.parse(response.text);
    }
    return { score: 0, issues: ["Failed to run analysis"], suggestions: [] };
};
