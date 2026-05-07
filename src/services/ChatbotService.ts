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
    // Check multiple possible sources for the API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined) ||
                   (typeof window !== 'undefined' ? (window as any).VITE_GEMINI_API_KEY : undefined);
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'MY_GEMINI_API_KEY') {
      console.error('Gemini API key is missing. Expected VITE_GEMINI_API_KEY to be set.');
      return "The Triumph Assistant is currently unavailable because the API key is not configured. Please ensure VITE_GEMINI_API_KEY is set in your environment variables.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      if (!response || !response.text) {
        throw new Error('Empty response from Gemini API');
      }

      return response.text;
    } catch (error: any) {
      console.error('Gemini Chatbot Error:', error);
      
      // Provide more helpful error messages if possible
      if (error.message?.includes('API_KEY_INVALID')) {
        return "The provided Gemini API key is invalid. Please check your configuration.";
      }
      if (error.message?.includes('QUOTA_EXCEEDED')) {
        return "The chatbot is currently busy. Please try again in a few minutes.";
      }
      
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }
};
