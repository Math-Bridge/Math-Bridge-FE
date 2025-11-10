import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('VITE_GEMINI_API_KEY is not set. Customer support chat will not work.');
}

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class GeminiService {
  private model = genAI?.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });
  private chat: ReturnType<NonNullable<typeof this.model>['startChat']> | null = null;

  /**
   * Initialize a new chat session with context about Math Bridge
   */
  initializeChat() {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    console.log('Initializing Gemini chat with API key:', API_KEY ? 'Present' : 'Missing');

    const systemContext = `You are a helpful customer support assistant for Math Bridge, an educational platform that connects students with tutors for math learning. 

Key features of Math Bridge:
- Students can find and book sessions with qualified math tutors
- Parents can manage their children's learning profiles
- We offer various tutoring packages and learning centers
- Users can schedule sessions, track progress, and manage contracts
- We support multiple roles: students, parents, tutors, staff, and administrators

Be friendly, professional, and helpful. Answer questions about:
- How to use the platform
- Booking tutoring sessions
- Managing profiles and accounts
- Subscription packages
- Payment and billing
- Tutor registration
- General platform navigation

If you don't know something specific, acknowledge it and suggest they contact support directly.`;

    this.chat = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemContext }],
        },
        {
          role: 'model',
          parts: [{ text: 'Hello! I\'m the Math Bridge support assistant. I\'m here to help you with any questions about our tutoring platform. How can I assist you today?' }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(message: string): Promise<string> {
    if (!this.chat) {
      this.initializeChat();
    }

    if (!this.model || !this.chat) {
      throw new Error('Gemini AI is not configured.');
    }

    try {
      console.log('Sending message to Gemini AI...');
      const result = await this.chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      console.log('Received response from Gemini AI');
      return text;
    } catch (error: unknown) {
      console.error('Detailed Gemini error:', error);

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Check for specific error types
        if (errorMessage.includes('api key') || errorMessage.includes('invalid') || errorMessage.includes('authentication')) {
          throw new Error('Invalid API key. Please verify your Gemini API key is correct.');
        }

        if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          throw new Error('API rate limit reached. Please wait a moment and try again.');
        }

        if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          throw new Error('AI model error. The service may be temporarily unavailable.');
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection.');
        }

        if (errorMessage.includes('blocked') || errorMessage.includes('safety')) {
          throw new Error('Content filtered by safety settings. Please rephrase your message.');
        }

        // Return the actual error message for debugging
        throw new Error(`AI Error: ${error.message}`);
      }
      
      throw new Error('Failed to get response from AI assistant. Please try again.');
    }
  }

  /**
   * Reset the chat session
   */
  resetChat() {
    this.chat = null;
  }

  /**
   * Check if Gemini is configured
   */
  isConfigured(): boolean {
    return !!API_KEY && !!this.model;
  }
}

export const geminiService = new GeminiService();

