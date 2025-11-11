# Troubleshooting: "Failed to get response from AI assistant"

## Quick Fixes (Try These First)

### 1. Verify API Key Format
Your API key should:
- Start with `AIza`
- Be around 39 characters long
- Have no spaces or quotes around it

Check your `.env` file:
```bash
cat .env
```

Should look like:
```
VITE_GEMINI_API_KEY=AIzaSyD...
```

NOT like:
```
VITE_GEMINI_API_KEY="AIzaSyD..."  ❌ (no quotes)
VITE_GEMINI_API_KEY= AIzaSyD...   ❌ (no space after =)
```

### 2. Restart Development Server
After changing `.env`, you MUST restart:
```bash
# Press Ctrl+C to stop
npm run dev
```

### 3. Check API Key Validity
Your API key might be:
- Expired
- Invalid
- From wrong project
- Restricted to specific referrers

**Solution:** Get a fresh API key:
1. Visit https://aistudio.google.com/app/apikey (NEW URL!)
2. Delete old key
3. Create new key
4. Copy to `.env`
5. Restart server

### 4. Try Different Model Names
The model name might have changed. I've updated the code to use `gemini-1.5-flash`.

Old models that may not work anymore:
- ❌ `gemini-pro` (might be deprecated)

Current working models:
- ✅ `gemini-1.5-flash` (recommended, fastest)
- ✅ `gemini-1.5-pro` (more capable)
- ✅ `gemini-pro` (legacy, might still work)

### 5. Test Your API Key Manually

Run this test in your project:

**Option A: Use the diagnostic tool**
1. Start your dev server: `npm run dev`
2. Look for a yellow diagnostic box on your page
3. Click "Run Diagnostic Test"
4. Check the results

**Option B: Test with curl**
```bash
# Replace YOUR_API_KEY with your actual key
curl -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY'
```

If this returns an error, your API key is the problem.

## Common Error Messages

### "API key not valid"
**Cause:** Invalid or expired API key
**Fix:** 
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key
3. Update `.env` file
4. Restart server

### "Failed to fetch" or "Network error"
**Cause:** 
- Firewall blocking Google AI
- CORS issues
- Internet connection

**Fix:**
1. Check your internet connection
2. Try on different network
3. Disable VPN if using one
4. Check if Google services are blocked in your region

### "Model not found"
**Cause:** Model name is wrong or deprecated
**Fix:** I've updated the code to use `gemini-1.5-flash`

### "Quota exceeded" or "Rate limit"
**Cause:** Too many requests
**Fix:** Wait 1 minute and try again

### "Request blocked by safety settings"
**Cause:** Your message was flagged
**Fix:** Rephrase your message (less sensitive content)

## Step-by-Step Diagnostic

### Step 1: Check Environment Variable
```bash
cd /home/pak/Documents/GitHub/Math-Bridge-FE
cat .env
```

Should show:
```
VITE_GEMINI_API_KEY=AIzaSy...
```

### Step 2: Check API Key Works
Visit: https://aistudio.google.com/app/apikey

Click "Try it" next to your API key. If it doesn't work there, create a new one.

### Step 3: Clear Browser Cache
```bash
# In browser console (F12)
localStorage.clear()
# Then reload page (Ctrl+R)
```

### Step 4: Check Browser Console
1. Open browser (F12)
2. Go to Console tab
3. Look for errors in red
4. Send me the error message

### Step 5: Test with Simple Script
Create test file:
```bash
cat > test-gemini.js << 'EOF'
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'YOUR_API_KEY_HERE'; // Replace this
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log('✅ Success:', response.text());
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF

node test-gemini.js
```

## Google AI Studio Changes (November 2024)

**Important:** Google has updated their AI platform:

### Old URL (might not work):
- ❌ https://makersuite.google.com/app/apikey

### New URL (use this):
- ✅ https://aistudio.google.com/app/apikey

### What Changed:
- "MakerSuite" → "Google AI Studio"
- Some old API keys might need to be regenerated
- Model names updated (use `gemini-1.5-flash`)

## If Nothing Works

### Option 1: Use a Different Model
I've updated the code to try multiple models. Check which one works:
- `gemini-1.5-flash` (recommended)
- `gemini-1.5-pro`
- `gemini-pro` (legacy)

### Option 2: Check API Status
Visit: https://status.cloud.google.com/
Look for any Google AI outages

### Option 3: Regional Restrictions
Google AI might not be available in your country. Check:
https://ai.google.dev/available_regions

### Option 4: Try Different Browser
Sometimes browser extensions block APIs. Try:
- Incognito mode
- Different browser
- Disable extensions

## What I've Already Fixed

✅ Updated model to `gemini-1.5-flash`
✅ Added better error handling
✅ Added detailed error messages
✅ Added safety settings
✅ Added console logging for debugging
✅ Created diagnostic tool
✅ Added fallback model options

## Next Steps for You

1. **Get fresh API key from NEW URL:**
   https://aistudio.google.com/app/apikey

2. **Update .env file:**
   ```bash
   VITE_GEMINI_API_KEY=your_new_key
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

4. **Check browser console (F12)** for specific error messages

5. **Try the diagnostic tool** (yellow box on page)

## Send Me This Info

If still not working, please provide:

1. Error message from browser console (F12)
2. First 10 characters of your API key (e.g., "AIzaSyDH9Z...")
3. Result of: `curl -I https://generativelanguage.googleapis.com`
4. Your country/region
5. Browser being used

## Alternative: Use OpenAI Instead

If Google Gemini doesn't work in your region, I can switch the implementation to use OpenAI's GPT (also has free tier).

Let me know if you want me to do that!

