# Customer Support AI Integration - Gemini AI

This document explains how to set up and use the AI-powered customer support chatbot in Math Bridge.

## Overview

The customer support feature uses Google's Gemini AI (free tier) to provide intelligent, context-aware assistance to users. The AI assistant can answer questions about:

- Platform features and navigation
- Booking tutoring sessions
- Managing profiles and accounts
- Subscription packages
- Payment and billing
- Tutor registration
- General platform usage

## Features

- ✨ **Free AI-powered chat** using Google Gemini Pro
- 💬 **Real-time conversation** with context awareness
- 🎨 **Beautiful UI** with smooth animations
- 📱 **Responsive design** works on all devices
- ♻️ **Conversation reset** to start fresh
- 🔄 **Minimize/Maximize** functionality
- 🚀 **Always accessible** floating button on all pages

## Setup Instructions

### 1. Get a Free Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

**Note:** The Gemini API is free to use with generous rate limits:
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

### 2. Configure Your Environment

1. Open the `.env` file in the project root
2. Add your Gemini API key:

```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

3. Save the file

### 3. Restart the Development Server

```bash
npm run dev
```

## Usage

### For End Users

1. **Open the chat**: Click the blue floating button with the chat icon in the bottom-right corner
2. **Ask questions**: Type your question in the input field and press Enter or click Send
3. **Continue conversation**: The AI remembers the context of your conversation
4. **Reset chat**: Click "Reset conversation" to start fresh
5. **Minimize**: Click the minimize icon to hide the chat but keep it open
6. **Close**: Click the X button to completely close the chat

### Example Questions

Here are some example questions you can ask:

- "How do I book a tutoring session?"
- "What subscription packages do you offer?"
- "How can I register as a tutor?"
- "I need help managing my child's profile"
- "What payment methods do you accept?"
- "How do I change my account settings?"

## File Structure

```
src/
├── services/
│   └── gemini.ts                          # Gemini AI service
├── components/
│   └── common/
│       ├── CustomerSupportButton.tsx      # Floating button component
│       ├── CustomerSupportChat.tsx        # Chat UI component
│       └── Layout.tsx                     # Updated to include support button
```

## Customization

### Modify AI Behavior

Edit `src/services/gemini.ts` to customize the AI's personality and knowledge:

```typescript
const systemContext = `You are a helpful customer support assistant for Math Bridge...`;
```

### Adjust Chat Styling

Edit `src/components/common/CustomerSupportChat.tsx` to customize:
- Colors and themes
- Chat bubble styles
- Window size and position
- Button appearance

### Change AI Model

The default model is `gemini-pro`. You can use other models:

```typescript
private model = genAI?.getGenerativeModel({ model: 'gemini-pro' });
```

Available models:
- `gemini-pro` - Best for text-only conversations
- `gemini-pro-vision` - For image and text input

## Technical Details

### Dependencies

- `@google/generative-ai` - Official Google Gemini SDK
- `lucide-react` - Icons
- `react` - UI framework

### Key Components

1. **GeminiService** (`src/services/gemini.ts`)
   - Manages AI conversation state
   - Handles API communication
   - Provides error handling

2. **CustomerSupportChat** (`src/components/common/CustomerSupportChat.tsx`)
   - Main chat interface
   - Message display and input
   - Loading and error states

3. **CustomerSupportButton** (`src/components/common/CustomerSupportButton.tsx`)
   - Floating action button
   - Toggle chat visibility
   - Badge and tooltip

### API Configuration

The chat uses these Gemini API parameters:

```typescript
generationConfig: {
  temperature: 0.7,      // Balance between creativity and consistency
  topK: 40,             // Consider top 40 tokens
  topP: 0.95,           // Nucleus sampling threshold
  maxOutputTokens: 1024 // Maximum response length
}
```

## Troubleshooting

### Chat shows "AI chat is not configured"

**Solution:** Make sure you've added the `VITE_GEMINI_API_KEY` to your `.env` file and restarted the dev server.

### "Invalid API key" error

**Solution:** Verify your API key is correct:
1. Check for extra spaces or quotes in `.env`
2. Ensure the key starts with your `.env` file format: `VITE_GEMINI_API_KEY=AIza...`
3. Try generating a new API key

### Chat is slow or not responding

**Possible causes:**
1. Network connection issues
2. Rate limits exceeded (unlikely with free tier limits)
3. API service temporarily down

**Solution:** 
- Check your internet connection
- Wait a moment and try again
- Check [Google AI Studio status](https://status.cloud.google.com/)

### Chat appears behind other elements

**Solution:** The chat has `z-50` class. If it's still behind, adjust the z-index in the component:

```tsx
className="... z-50"  // Increase to z-[100] if needed
```

## Best Practices

1. **API Key Security**
   - Never commit `.env` file to version control
   - Use `.env.example` as a template
   - Keep your API key private

2. **Rate Limiting**
   - The free tier has generous limits
   - Implement user-side throttling if needed
   - Monitor usage in Google AI Studio

3. **User Experience**
   - Keep the chat easily accessible
   - Provide clear error messages
   - Offer option to contact human support

4. **Content Moderation**
   - The AI has built-in safety filters
   - Monitor conversations for quality
   - Update system context as needed

## Future Enhancements

Possible improvements:

- 📊 **Analytics**: Track common questions and user satisfaction
- 💾 **History**: Save chat history across sessions
- 🌐 **Multi-language**: Support multiple languages
- 🤖 **Advanced context**: Integrate with user's account data
- 📧 **Escalation**: Option to email support team
- 🎯 **Smart suggestions**: Show common questions as quick buttons

## Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Google AI Studio](https://makersuite.google.com/)
- [Best Practices for Prompts](https://ai.google.dev/docs/prompt_best_practices)

## Support

If you encounter issues with the customer support feature:

1. Check this README for solutions
2. Review error messages in the browser console
3. Verify API key configuration
4. Check the [Google AI Developer Forum](https://discuss.ai.google.dev/)

---

**Note:** This feature uses Google's free Gemini API. While it has generous limits for personal and small business use, monitor your usage if you expect high traffic.

