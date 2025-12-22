
import { GoogleGenAI } from "@google/genai";
import { Student } from "../types";

export type MessageType = 'payment' | 'absence' | 'general' | 'registration' | 'schedule' | 'exam';

export const generateWhatsAppDraft = async (student: Student, type: MessageType): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are the Official Communication Officer for "Excellence English", a premier English Language Institute in Sri Lanka.
    Task: Generate a professional, concise, and bilingual message (English and Sinhala) for a parent.

    STUDENT CONTEXT:
    - Name: ${student.name}
    - Level: ${student.grade}
    - Parent: ${student.parentName}
    - ID: ${student.id}
    - Message Category: ${type.toUpperCase()}

    MESSAGE STRUCTURE REQUIREMENTS:
    1. HEADER: Must start with "EXCELLENCE ENGLISH - OFFICIAL NOTIFICATION"
    2. SUBJECT: A clear line stating the purpose (e.g., "Subject: Tuition Payment Received")
    3. BODY (ENGLISH): A polite 1-2 sentence message.
    4. BODY (SINHALA): An accurate and polite Sinhala translation of the English body.
    5. FOOTER: Include "Excellence English Office: 077 123 4567" (Placeholder) and "Thank you / ස්තුතියි".

    SPECIFIC GUIDELINES PER TYPE:
    - registration: Welcome them to the institute and mention their new Student ID.
    - payment: Confirm receipt of fees for ${student.lastPaymentMonth} or remind them if overdue.
    - absence: Inform parents that ${student.name} was not present at the gate today.
    - schedule: Inform about a class time change or upcoming special session.
    - exam: Share that results have been posted to the assessment portal.
    - general: General announcement regarding institute holidays or events.

    FORMATTING:
    - Use clear spacing between English and Sinhala sections.
    - Do not use markdown like bold (**) or headers (#).
    - Keep total length suitable for a single WhatsApp screen.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate message.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "EXCELLENCE ENGLISH - ERROR\n\nSystem failed to generate AI draft. Please contact technical support.\n\nExcellence English Office.";
  }
};
