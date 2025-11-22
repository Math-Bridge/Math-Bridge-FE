# 🧪 Testing Guide: AI Chatbot with API Integration

## Quick Test Scenarios

### 🎯 Scenario 1: Parent User
**Login as:** Parent account

**Test Questions:**
1. "Show me my children"
   - ✅ Should list actual children with grades and schools
   
2. "What are my upcoming sessions?"
   - ✅ Should show scheduled tutoring sessions with dates and tutors
   
3. "Tell me about my active contracts"
   - ✅ Should list packages and tutors assigned
   
4. "How is my child's progress?"
   - ✅ Should reference specific child by name

**Expected Behavior:**
- AI greets by name: "Hello [Parent Name]!"
- Shows role in header: "Personalized for parent"
- References actual data from API
- Provides specific, actionable information

---

### 👨‍🏫 Scenario 2: Tutor User
**Login as:** Tutor account

**Test Questions:**
1. "What sessions do I have today?"
   - ✅ Should show today's scheduled sessions
   
2. "Show me my statistics"
   - ✅ Should display total sessions, ratings, etc.
   
3. "How many students am I teaching?"
   - ✅ Should calculate from active contracts/sessions
   
4. "What are my upcoming classes?"
   - ✅ Should list future scheduled sessions

**Expected Behavior:**
- Personalized greeting with tutor's name
- Header shows: "Personalized for tutor"
- Accesses tutor-specific endpoints
- Shows tutor statistics and schedules

---

### 🌍 Scenario 3: General Inquiries (Any User)
**Test Questions:**
1. "Where are your learning centers?"
   - ✅ Should list all centers with addresses and phone numbers
   
2. "Show me available tutors"
   - ✅ Should display list of available tutors with specializations
   
3. "How do I book a session?"
   - ✅ Should provide step-by-step guidance
   
4. "What packages do you offer?"
   - ✅ Should explain available tutoring packages

**Expected Behavior:**
- Fetches real center and tutor data from API
- Provides current, accurate information
- Clear, actionable instructions

---

### 🔒 Scenario 4: Non-Logged-In User
**State:** Not authenticated

**Test Questions:**
1. "How does Math Bridge work?"
   - ✅ Should provide general platform overview
   
2. "How do I sign up?"
   - ✅ Should guide through registration process
   
3. "Where are your centers?"
   - ✅ May show limited public information

**Expected Behavior:**
- Generic welcome message
- No personalized data
- General platform information only
- No "Context-aware AI" badge

---

## 🔍 Testing Checklist

### Initial Load Tests
- [ ] Chat button appears in bottom-right corner
- [ ] Clicking opens chat window
- [ ] Welcome message appears
- [ ] User name displayed in greeting (if logged in)
- [ ] Role shown in header (if logged in)

### Context Tests
- [ ] User role correctly identified
- [ ] Personalized greeting uses actual user name
- [ ] Header shows "Personalized for [role]"
- [ ] Different welcome based on login state

### API Integration Tests
- [ ] Queries about centers fetch real data
- [ ] Queries about tutors fetch real data
- [ ] User-specific queries return user's data
- [ ] No cross-user data contamination
- [ ] Error handling when API fails
- [ ] Graceful fallback to generic responses

### UI/UX Tests
- [ ] Sparkle icon visible in header
- [ ] Messages scroll automatically
- [ ] Loading indicator shows during API calls
- [ ] Error messages display appropriately
- [ ] Minimize/maximize works correctly
- [ ] Close button works
- [ ] Reset conversation clears chat
- [ ] Input field focus works

### Performance Tests
- [ ] First response within 3 seconds
- [ ] Subsequent responses within 2 seconds
- [ ] No memory leaks on long conversations
- [ ] API calls don't block UI
- [ ] Large data sets handled efficiently

---

## 🎬 Step-by-Step Test Flow

### Test 1: Parent Full Journey

```
1. Login as parent → "john.parent@example.com"
2. Open chat (click blue button)
3. Observe: "Hello John! 👋 I'm your AI assistant..."
4. Type: "show me my children"
5. Verify: Lists actual children from API
6. Type: "when is my next session?"
7. Verify: Shows upcoming session details
8. Type: "tell me about my contracts"
9. Verify: Lists active contracts with tutors
10. Click "Reset conversation"
11. Verify: Chat resets with new welcome
```

### Test 2: Tutor Full Journey

```
1. Login as tutor → "jane.tutor@example.com"
2. Open chat
3. Observe: Personalized greeting with name
4. Type: "what's my schedule today?"
5. Verify: Shows today's sessions
6. Type: "how many sessions have I completed?"
7. Verify: Shows statistics from API
8. Type: "show available students"
9. Verify: Provides relevant information
10. Minimize chat
11. Verify: Chat collapses to title bar only
```

### Test 3: Center Lookup

```
1. Any logged-in user
2. Open chat
3. Type: "where are your centers?"
4. Verify: Lists centers with real addresses
5. Type: "which center is closest to downtown?"
6. Verify: AI provides relevant answer
7. Type: "what's the phone number for [center name]?"
8. Verify: Provides actual phone from API
```

### Test 4: Error Handling

```
1. Disconnect internet
2. Open chat
3. Type: "show me my data"
4. Verify: Error handled gracefully
5. Verify: Generic help still available
6. Reconnect internet
7. Type again
8. Verify: Works normally
```

---

## 🐛 Known Issues & Workarounds

### Issue: API timeout on initial load
**Workaround:** System automatically retries; user sees generic response first

### Issue: Large data sets slow down response
**Workaround:** Results limited to top 5 items; can be adjusted

### Issue: Real-time data not updated
**Workaround:** Click "Reset conversation" to refresh context

---

## 📊 Testing Metrics

### Success Criteria
- ✅ 95%+ queries return relevant responses
- ✅ User data correctly identified 100% of time
- ✅ API integration works for all major queries
- ✅ Response time < 3 seconds for complex queries
- ✅ No crashes or freezes during normal use
- ✅ Error messages are user-friendly
- ✅ Mobile responsiveness maintained

---

## 🔧 Developer Testing Tools

### Browser Console Checks
```javascript
// Check if Gemini is configured
geminiService.isConfigured() // Should return true

// Check current user context
localStorage.getItem('user') // Should show user data

// Check auth token
localStorage.getItem('authToken') // Should exist
```

### Network Tab Checks
- Monitor API calls during chat queries
- Verify correct endpoints called
- Check response times
- Verify no CORS errors

### React DevTools Checks
- Inspect CustomerSupportChat props
- Verify user context passed correctly
- Check state updates during conversation
- Monitor re-renders

---

## 💡 Sample Queries for Each Feature

### User Data Queries
```
✅ "What children do I have registered?"
✅ "Show my profile information"
✅ "When did I create my account?"
✅ "What's my role on the platform?"
```

### Session Queries
```
✅ "What sessions do I have today?"
✅ "Show my schedule for this week"
✅ "When is my next tutoring session?"
✅ "List all my upcoming appointments"
```

### Contract Queries
```
✅ "What packages am I subscribed to?"
✅ "Tell me about my active contracts"
✅ "Who is my assigned tutor?"
✅ "When does my contract expire?"
```

### Center Queries
```
✅ "Where are your learning centers?"
✅ "Show me the nearest center"
✅ "What's the address of [center name]?"
✅ "Do you have a center in [location]?"
```

### Tutor Queries
```
✅ "Who are the available tutors?"
✅ "Show me tutors specialized in algebra"
✅ "Find me a tutor for [subject]"
✅ "What tutors are available today?"
```

### Platform Help Queries
```
✅ "How do I book a session?"
✅ "How do I reschedule a session?"
✅ "How does payment work?"
✅ "How do I update my profile?"
```

---

## 🎯 Edge Cases to Test

1. **Empty Data Sets**
   - User with no children
   - User with no contracts
   - Tutor with no sessions
   
2. **Special Characters**
   - Names with apostrophes
   - Addresses with commas
   - Special characters in messages
   
3. **Long Conversations**
   - 20+ message exchanges
   - Check memory usage
   - Verify context maintained
   
4. **Concurrent Users**
   - Multiple chat windows open
   - Switch between users
   - Verify no data mixing
   
5. **Slow API Responses**
   - Simulate slow network
   - Verify timeout handling
   - Check loading indicators

---

## 📝 Bug Report Template

```markdown
## Bug Report

**Title:** [Brief description]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- User Role: [Parent/Tutor/Admin]
- Logged In: [Yes/No]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Console Errors:**
```
[Paste any console errors]
```

**Network Errors:**
[Any failed API calls]

**Screenshots:**
[If applicable]
```

---

## ✅ Pre-Release Checklist

Before deploying to production:

- [ ] All test scenarios pass
- [ ] No console errors in production build
- [ ] API endpoints verified in production
- [ ] Gemini API key configured
- [ ] User authentication works
- [ ] Mobile responsive design confirmed
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] User training materials prepared

---

## 🚀 Next Steps After Testing

1. **Gather Feedback**
   - Have real users test the chatbot
   - Collect common questions
   - Note any confusion points

2. **Monitor Usage**
   - Track query types
   - Monitor API call frequency
   - Measure response times

3. **Iterate**
   - Add more API integrations
   - Improve response quality
   - Expand query detection

4. **Optimize**
   - Cache frequently accessed data
   - Batch API calls where possible
   - Fine-tune AI prompts

---

**Happy Testing! 🎉**

For issues or questions, refer to:
- [AI Integration Guide](./AI_CHATBOT_API_INTEGRATION.md)
- [Customer Support Documentation](./CUSTOMER_SUPPORT_IMPLEMENTATION.md)
