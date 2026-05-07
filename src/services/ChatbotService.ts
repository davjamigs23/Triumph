import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are the Triumph Yearbook Publishing FAQ assistant. 
Answer questions about photo sessions, requirements, payments, and batch management.
Rules:
1. If you don't know the answer, ask them to contact the staff via the Help section.
2. Photo sessions are booked in the 'My Schedule' section.
3. Documents (Clearance, Payment Proof) are uploaded in 'My Documents'.
4. Students must reach 100% completion status to finalize their entries.
5. Dress code for photo sessions: Formal attire (Men: White shirt/Blazer; Women: White blouse/Blazer).
6. Deadlines are visible on the Student Dashboard.
Be professional, encouraging, and helpful.
`;

export const ChatbotService = {
  async getResponse(message: string) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY') {
      console.error('Gemini API key is missing.');
      return "The Triumph Assistant is currently unavailable because the API key is not configured. Please contact the administrator.";
    }

    try {
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      const result = await model.generateContent(message);
      const response = await result.response;
      return response.text() || "I'm sorry, I couldn't process that request. Please try again or contact staff.";
    } catch (error) {
      console.error('Chatbot error:', error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }
};
