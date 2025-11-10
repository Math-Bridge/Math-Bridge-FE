// Test script to verify Gemini API configuration
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function testGeminiConnection() {
  console.log('=== Gemini API Test ===');
  console.log('API Key present:', !!API_KEY);
  console.log('API Key length:', API_KEY?.length || 0);
  console.log('API Key starts with AIza:', API_KEY?.startsWith('AIza') || false);

  if (!API_KEY) {
    console.error('❌ No API key found in environment variables');
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Try gemini-2.5-flash first (current stable)
    console.log('\nTesting gemini-2.5-flash model...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent('Say "Hello" in one word');
      const response = await result.response;
      const text = response.text();
      console.log('✅ gemini-2.5-flash works! Response:', text);
      return true;
    } catch (flashError) {
      console.log('⚠️ gemini-2.5-flash failed:', (flashError as Error).message);
    }

    // Try gemini-2.0-flash as fallback
    console.log('\nTesting gemini-2.0-flash model...');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('Say "Hello" in one word');
      const response = await result.response;
      const text = response.text();
      console.log('✅ gemini-2.0-flash works! Response:', text);
      return true;
    } catch (flashError) {
      console.log('⚠️ gemini-2.0-flash failed:', (flashError as Error).message);
    }

    console.error('❌ All models failed');
    return false;

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);

      if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
        console.error('\n🔑 Your API key appears to be invalid.');
        console.error('Please verify:');
        console.error('1. Get a new key from: https://makersuite.google.com/app/apikey');
        console.error('2. Make sure it starts with "AIza"');
        console.error('3. No extra spaces in .env file');
        console.error('4. Restart your dev server after updating .env');
      }
    }
    return false;
  }
}

// Auto-run test in development
if (import.meta.env.DEV) {
  testGeminiConnection().then(success => {
    if (success) {
      console.log('\n✅ Gemini API is properly configured and working!');
    } else {
      console.error('\n❌ Gemini API test failed. Check the errors above.');
    }
  });
}

