#!/bin/bash

echo "🔍 Gemini API Diagnostic Test"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Create .env file with: VITE_GEMINI_API_KEY=your_key"
    exit 1
fi

echo "✅ .env file exists"

# Extract API key
API_KEY=$(grep VITE_GEMINI_API_KEY .env | cut -d '=' -f2 | tr -d ' "'"'"'')

if [ -z "$API_KEY" ]; then
    echo "❌ No API key found in .env file"
    echo "   Add: VITE_GEMINI_API_KEY=your_key"
    exit 1
fi

echo "✅ API key found in .env"
echo "   Length: ${#API_KEY} characters"
echo "   Starts with: ${API_KEY:0:10}..."

# Check if it starts with AIza
if [[ $API_KEY == AIza* ]]; then
    echo "✅ API key format looks correct (starts with AIza)"
else
    echo "⚠️  Warning: API key doesn't start with 'AIza'"
    echo "   Google API keys typically start with 'AIza'"
fi

echo ""
echo "🌐 Testing API connection..."
echo ""

# Test with curl
RESPONSE=$(curl -s -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello in one word"}]}]}' \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$API_KEY" 2>&1)

# Check if response contains error
if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ API test failed!"
    echo ""
    echo "Error response:"
    echo "$RESPONSE" | grep -A 5 "error"
    echo ""
    echo "Common issues:"
    echo "  1. Invalid API key - Get new one from: https://aistudio.google.com/app/apikey"
    echo "  2. API key restrictions - Check key settings in AI Studio"
    echo "  3. Quota exceeded - Wait a moment and try again"
    echo ""
elif echo "$RESPONSE" | grep -q "text"; then
    echo "✅ API test successful!"
    echo ""
    echo "AI Response:"
    echo "$RESPONSE" | grep -o '"text":"[^"]*"' | head -1
    echo ""
    echo "🎉 Your Gemini API is working correctly!"
    echo ""
    echo "If the chat still doesn't work:"
    echo "  1. Make sure you restarted the dev server after updating .env"
    echo "  2. Check browser console (F12) for errors"
    echo "  3. Try clearing browser cache and reloading"
else
    echo "⚠️  Unexpected response"
    echo "$RESPONSE"
fi

echo ""
echo "📚 For more help, see: TROUBLESHOOTING.md"
echo ""

