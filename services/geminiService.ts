
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

// Refactored to strictly follow @google/genai coding guidelines
export const generateWhatsAppDraft = async (student: Student, type: 'payment' | 'absence' | 'general'): Promise<string> => {
  // Always use process.env.API_KEY directly for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Generate a professional and friendly WhatsApp message for the parent of a student in an English language institute in Sri Lanka.
    The institute is "Excellence English".
    Student Name: ${student.name}
    Grade: ${student.grade}
    Parent Name: ${student.parentName}
    Message Type: ${type}
    Current Last Payment Month: ${student.lastPaymentMonth}

    Instructions:
    - Use polite language.
    - Mention the institute name "Excellence English".
    - Include a Sinhala translation of the main message at the bottom.
    - Do not use markdown formatting like bold or headers.
    - Keep it short and actionable.
  `;

  try {
    // Correct usage of ai.models.generateContent with model and contents
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Use .text property directly
    return response.text || "Failed to generate message.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI message. Please try again.";
  }
};
