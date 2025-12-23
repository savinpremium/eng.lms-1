
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
  classObj?: ClassGroup,
  institutionName?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const instName = institutionName || "Smart Campus";
  
  const prompt = `You are the Administrative Office at "${instName}". Compose a warm, professional, bilingual (English and Sinhala) message for parents.
Institution: ${instName}
Target: ${student ? `${student.name} (${student.id})` : (classObj ? `Class Batch: ${classObj.name}` : 'Parent')}
Category: ${type.toUpperCase()}
Note: ${customInput || 'Standard institutional update'}

Rules:
1. No technical jargon like "Billing" or "Arrears". Use "Monthly Class Dues" or "Attendance Update".
2. Be extremely polite and reassuring. English first, then Sinhala.
3. No markdown symbols like ** or ##.
4. Branding: SmartClass.lk System.
5. Footer: ${instName} Office | System Powered by SmartClass.lk`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt.trim(),
    });
    return response.text || "Composition unavailable. Please draft manually.";
  } catch (error) {
    console.error("Gemini RPC Error:", error);
    return `${instName.toUpperCase()}\n\nSystem is currently processing. Please contact the office for assistance.\n\nස්තුතියි.\nPowered by SmartClass.lk`;
  }
};
