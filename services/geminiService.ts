
import { GoogleGenAI } from "@google/genai";
import { Student, ClassGroup } from "../types";

export type MessageType = 
  | 'payment_received' 
  | 'payment_late' 
  | 'absence' 
  | 'general' 
  | 'registration' 
  | 'schedule' 
  | 'exam' 
  | 'custom'
  | 'class_notes';

export const generateWhatsAppDraft = async (
  student: Student | null, 
  type: MessageType, 
  customInput?: string,
  classObj?: ClassGroup
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are the Head Teacher and Parent Relations Manager at "Excellence English" Sri Lanka.
    Your objective is to communicate clearly but with extreme warmth, respect, and a human touch.

    STRICT VOCABULARY RULES:
    1. PROHIBITED TERMS: "Billing Cycle", "Arrears", "Debt", "Transaction", "Overdue", "Settlement", "Ledger", "Protocol".
    2. REQUIRED TERMS: "Monthly Class Fee", "Class Contribution", "Lesson Fee", "Class Update".
    3. Use phrases like: "We hope this finds you well", "We kindly appreciate your support", "It is a joy to teach ${student?.name || 'your child'}".

    BILINGUAL ENFORCEMENT:
    - You MUST provide an English version first.
    - Follow it immediately with a natural, polite Sinhala (සිංහල) translation.

    CONTEXT:
    - Institute: Excellence English
    - Target: ${student ? `${student.name} (${student.id})` : (classObj ? `Class: ${classObj.name}` : 'All Parents')}
    - Category: ${type.toUpperCase()}
    ${customInput ? `- Staff rough notes to refine: "${customInput}"` : ''}

    MESSAGE LOGIC PER CATEGORY:
    - payment_received: Confirm reception of the monthly class fee for ${student?.lastPaymentMonth || 'this month'}. Express gratitude for supporting their child's education.
    - payment_late: A very gentle, soft reminder that the monthly class fee for ${student?.name || 'the student'} has not been updated in our records yet. Ask if they need any assistance.
    - class_notes: Based on rough notes, write a friendly summary of what was taught today. End with encouragement.
    - custom: Take the rough staff input and expand it into a beautiful, polite, bilingual official notice.

    FORMATTING:
    - No markdown (** or ##).
    - Clear spacing between English and Sinhala.
    - Header: "EXCELLENCE ENGLISH - FAMILY UPDATE"
    - Footer: "Excellence English Office | 077 123 4567 | Thank you / ස්තුතියි"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I'm sorry, I couldn't compose that message right now. Please try a manual draft.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "EXCELLENCE ENGLISH\n\nWe are currently experiencing a system update. Please contact the office for any assistance.\n\nThank you for your patience.";
  }
};
