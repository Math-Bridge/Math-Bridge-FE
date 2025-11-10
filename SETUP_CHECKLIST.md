# ✅ Customer Support Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Before You Start

- [ ] You have a Google account
- [ ] You have access to the project's `.env` file
- [ ] Development server is running (or can be restarted)

## Setup Steps

### 1. Get API Key (2 minutes)

- [ ] Visit https://makersuite.google.com/app/apikey
- [ ] Sign in with your Google account
- [ ] Click "Create API Key" button
- [ ] Copy the generated API key (starts with `AIza...`)
- [ ] Keep the key secure and private

### 2. Configure Environment (1 minute)

- [ ] Open `.env` file in project root
- [ ] Add line: `VITE_GEMINI_API_KEY=your_actual_key_here`
- [ ] Replace `your_actual_key_here` with your copied key
- [ ] Save the file
- [ ] Verify no extra spaces or quotes around the key

### 3. Restart Development Server (1 minute)

- [ ] Stop current dev server (Ctrl+C in terminal)
- [ ] Run: `npm run dev`
- [ ] Wait for server to start
- [ ] Open browser to your local development URL

### 4. Test the Feature (2 minutes)

- [ ] Look for blue floating button in bottom-right corner
- [ ] Click the chat button
- [ ] Chat window opens successfully
- [ ] No "not configured" warning appears
- [ ] Type a test message: "Hello"
- [ ] AI responds within a few seconds
- [ ] Try asking: "How do I book a session?"
- [ ] AI provides helpful response about Math Bridge

### 5. Test Features (3 minutes)

- [ ] **Minimize/Maximize**: Click minimize button (works)
- [ ] **Navigation**: Navigate to different pages (button stays visible)
- [ ] **Reset**: Click "Reset conversation" (clears chat)
- [ ] **Mobile**: Resize browser window (responsive design)
- [ ] **Errors**: Turn off internet, verify error handling
- [ ] **Context**: Ask follow-up question (AI remembers context)

### 6. Optional Customization

- [ ] Review AI personality in `src/services/gemini.ts`
- [ ] Adjust styling in `src/components/common/CustomerSupportChat.tsx`
- [ ] Change button position if needed
- [ ] Add company-specific information to AI context

## Verification

### Visual Checks
- [ ] Chat button appears on all pages
- [ ] Button has blue background with message icon
- [ ] Small "AI" badge on button
- [ ] Hover tooltip shows helpful message

### Functional Checks
- [ ] Chat opens and closes smoothly
- [ ] Messages send successfully
- [ ] AI responds appropriately
- [ ] Loading animation shows while waiting
- [ ] Error messages display if needed
- [ ] Timestamps appear on messages

### Performance Checks
- [ ] Chat loads quickly (< 1 second)
- [ ] AI responses arrive in 2-5 seconds
- [ ] No console errors in browser
- [ ] Smooth animations
- [ ] No layout shifts

## Troubleshooting

If something doesn't work, check:

- [ ] API key is correct in `.env`
- [ ] Dev server was restarted after adding key
- [ ] No browser console errors
- [ ] Internet connection is working
- [ ] Browser cache is cleared

## Production Deployment

Before deploying to production:

- [ ] Verify `.env` is in `.gitignore`
- [ ] Add `VITE_GEMINI_API_KEY` to production environment variables
- [ ] Test on production build: `npm run build`
- [ ] Preview production build: `npm run preview`
- [ ] Test chat on production build
- [ ] Monitor API usage in Google AI Studio

## Documentation Review

- [ ] Read `AI_SUPPORT_QUICKSTART.md`
- [ ] Review `CUSTOMER_SUPPORT_README.md`
- [ ] Check `CUSTOMER_SUPPORT_IMPLEMENTATION.md`
- [ ] Open `CUSTOMER_SUPPORT_DEMO.html` in browser

## Team Communication

- [ ] Inform team about new feature
- [ ] Share setup instructions
- [ ] Provide API key securely (if needed)
- [ ] Document in team wiki/docs
- [ ] Add to onboarding checklist

## Ongoing Maintenance

- [ ] Monitor API usage weekly
- [ ] Check error logs for issues
- [ ] Collect user feedback
- [ ] Update AI context as platform evolves
- [ ] Review and improve responses

## Success Criteria

You're done when:
- ✅ Chat button appears on website
- ✅ Users can click and start chatting
- ✅ AI provides helpful, relevant responses
- ✅ No errors in console
- ✅ Team is informed and trained

---

## 🎉 Congratulations!

Once all items are checked, your AI customer support is live!

**Estimated Total Time: 10 minutes**

---

## Quick Reference

**API Key Location:** `.env` file
**Documentation:** `CUSTOMER_SUPPORT_README.md`
**Get API Key:** https://makersuite.google.com/app/apikey
**Support:** https://discuss.ai.google.dev/

---

*Keep this checklist for future reference or onboarding new team members.*

