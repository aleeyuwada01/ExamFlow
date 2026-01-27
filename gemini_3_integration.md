# Gemini 3 Integration Logic

This document details how the application uses the `@google/genai` SDK with the `gemini-3-pro-preview` model to generate structured exam content and analyze images.

## 1. Initialization and Configuration

We use `gemini-3-pro-preview` for complex tasks (Reasoning, OCR, Creative Generation) and `gemini-2.5-flash` for faster, lighter tasks.

```typescript
import { GoogleGenAI, Type, Schema } from "@google/genai";

// Using gemini-3-pro-preview for high reasoning capabilities and better OCR
const MODEL_NAME = "gemini-3-pro-preview";
const FAST_MODEL = "gemini-2.5-flash"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

## 2. JSON Schemas

To ensure Gemini returns data we can programmatically use in the React app, we define strict JSON schemas.

```typescript
// Schema for a single question
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

// Schema for the entire exam section
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
```

## 3. Question Generation (Text-to-JSON)

This function generates questions based on metadata (Subject, Topic) and optional context (Lesson Plan). It utilizes the `thinkingConfig` to allow the model to reason about the curriculum before generating.

```typescript
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

    // Inject teacher's notes if provided
    if (lessonPlan) {
      prompt += `\n\nUse the following Teacher's Lesson Plan / Notes to tailor the questions specifically to what was taught:\n"${lessonPlan}"\n`;
    }

    prompt += `\nReturn the result as a list of sections (usually just one, but strict format).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME, // gemini-3-pro-preview
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema, // Enforces the JSON structure
        thinkingConfig: { thinkingBudget: 2048 }, // Allocates tokens for reasoning
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Post-processing to add internal UUIDs for React state management
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
```

## 4. File Understanding / OCR (Image-to-JSON)

This function takes a Base64 encoded image string (from a file upload or camera snap) and extracts questions directly into the structured format.

```typescript
export const ocrFromImage = async (base64Image: string, mimeType: string = "image/jpeg"): Promise<ExamSection[]> => {
  try {
    const prompt = `Analyze this image of a handwritten exam. 
    1. Extract all questions.
    2. Correct any spelling or grammar errors (Standard British English).
    3. Categorize them into sections if apparent, otherwise create a "General" section.
    4. Determine the question type (OBJ, FILL, THEORY) automatically.
    5. Output strictly in the requested JSON format.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME, // gemini-3-pro-preview
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image, // Base64 string of the image
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: examSectionSchema,
         thinkingConfig: { thinkingBudget: 2048 }, // Higher budget for visual analysis
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
```
