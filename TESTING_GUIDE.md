# Testing Guide: AI Product-Focused & Handoff Protocol

## Quick Test Scenarios

### Test 1: Product-Focused Behavior (Off-Topic Rejection)

**Test Case 1.1: General Knowledge Question**
```
User: "What is artificial intelligence?"
Expected: AI redirects → "I'm here to help with our product and services 😊 How can I assist you with that?"
```

**Test Case 1.2: Coding Question**
```
User: "How does coding work?"
Expected: AI redirects → "I can help you with anything related to our product. What would you like to explore?"
```

**Test Case 1.3: Unrelated Topic**
```
User: "Tell me about sports"
Expected: AI redirects → "Let's focus on how I can assist you with our product. What are you looking for?"
```

**Test Case 1.4: Casual Greeting**
```
User: "Hi, how are you?"
Expected: AI responds warmly then guides to product → "Hey! 👋 I'm doing great, thanks for asking! How can I help you with our product today?"
```

---

### Test 2: Product Questions (Should Answer)

**Test Case 2.1: Pricing Question**
```
User: "What are your pricing plans?"
Expected: AI answers with product info → "Great question! We have Starter ($29/mo), Pro ($99/mo), and Enterprise (custom) plans. Could you share your company size and email? I'll send you detailed pricing."
```

**Test Case 2.2: Features Question**
```
User: "What are the main features?"
Expected: AI answers with features list
```

**Test Case 2.3: Demo Request**
```
User: "I would like to book a demo"
Expected: AI responds positively and gathers lead info
```

---

### Test 3: Human Agent Handoff Protocol

**Test Case 3.1: Initial Handoff Request**
```
Step 1: User: "I want to talk to a human"
Expected: AI responds → "Sure, I'm connecting you to a human agent right now. While you wait, you can continue typing your issue — the agent will see your messages."

Step 2: Check database
Expected: Chat is marked as escalated (is_escalated = true)
```

**Test Case 3.2: First Message After Escalation**
```
Step 1: (Chat is already escalated from Test 3.1)
Step 2: User: "Hello? Anyone there?"
Expected: AI responds ONCE → "I've already connected you to a human agent. They will assist you shortly."
```

**Test Case 3.3: Second Message After Escalation (Silence Mode)**
```
Step 1: (Chat is escalated, acknowledgment already sent)
Step 2: User: "Are you there?"
Expected: AI stays COMPLETELY SILENT (no response at all)
```

**Test Case 3.4: Off-Topic Question After Escalation (Silence Mode)**
```
Step 1: (Chat is escalated, acknowledgment already sent)
Step 2: User: "What is AI?"
Expected: AI stays COMPLETELY SILENT (does NOT redirect, does NOT answer)
```

**Test Case 3.5: Product Question After Escalation (Silence Mode)**
```
Step 1: (Chat is escalated, acknowledgment already sent)
Step 2: User: "What are your pricing plans?"
Expected: AI stays COMPLETELY SILENT (does NOT answer even product questions)
```

**Test Case 3.6: Multiple Messages After Escalation**
```
Step 1: (Chat is escalated, acknowledgment already sent)
Step 2: User: "Hello?"
Step 3: User: "Is anyone there?"
Step 4: User: "I need help"
Expected: AI stays SILENT for ALL messages
```

---

### Test 4: Edge Cases

**Test Case 4.1: Frustrated User (Before Escalation)**
```
User: "This is ridiculous! Nothing works!"
Expected: AI may suggest human agent OR try to help (depends on sentiment detection)
```

**Test Case 4.2: Pricing Question Should NOT Auto-Escalate**
```
User: "How much does this cost?"
Expected: AI answers with pricing info (does NOT escalate immediately)
```

**Test Case 4.3: Demo Request Should NOT Auto-Escalate**
```
User: "Can I get a demo?"
Expected: AI responds positively and gathers info (does NOT escalate immediately)
```

---

## Testing Workflow

### Setup
1. Start backend: `cd backend && python main.py`
2. Start frontend: `cd frontend && npm run dev`
3. Login with test user
4. Open chat interface

### Test Sequence (Recommended Order)

#### Phase 1: Product-Focused Behavior (5 minutes)
1. Test off-topic questions (Test 1.1, 1.2, 1.3)
2. Test casual greeting (Test 1.4)
3. Test product questions (Test 2.1, 2.2, 2.3)
4. Verify AI answers product questions but redirects off-topic

#### Phase 2: Handoff Protocol (10 minutes)
1. Start fresh chat
2. Request human agent (Test 3.1)
3. Verify escalation in database
4. Send first message after escalation (Test 3.2)
5. Send second message after escalation (Test 3.3)
6. Verify AI stays silent
7. Try off-topic question (Test 3.4)
8. Try product question (Test 3.5)
9. Send multiple messages (Test 3.6)
10. Verify AI stays silent for ALL messages

#### Phase 3: Edge Cases (5 minutes)
1. Test frustrated user (Test 4.1)
2. Verify pricing doesn't auto-escalate (Test 4.2)
3. Verify demo doesn't auto-escalate (Test 4.3)

---

## Expected Behavior Summary

### Before Escalation
✅ Answers product questions naturally
✅ Redirects off-topic questions immediately
✅ Gathers lead information
✅ Responds to greetings warmly then guides to product
✅ Does NOT auto-escalate for pricing/demo/features

### During Escalation (First Request)
✅ Responds with connection message
✅ Marks chat as escalated in database
✅ Explains user can continue typing

### After Escalation (First User Message)
✅ Responds ONCE with acknowledgment
✅ Tells user agent will assist shortly

### After Acknowledgment (All Subsequent Messages)
✅ COMPLETE SILENCE
✅ No responses to any messages
✅ No redirects for off-topic questions
✅ No answers to product questions
✅ Human agent must take over

---

## Debugging Tips

### If AI Keeps Responding After Escalation
1. Check database: Is `is_escalated` set to `true`?
2. Check backend logs: Is HANDOFF_ACTIVE context being added?
3. Check AI response: Does it see the escalation flag?

### If AI Doesn't Redirect Off-Topic Questions
1. Check system prompt: Is it loaded correctly?
2. Check AI model: Is it using the right model (llama-3.1-8b-instant)?
3. Test with clear off-topic questions first

### If AI Auto-Escalates for Pricing
1. Check escalation.py: Are pricing keywords removed?
2. Check intent.py: Is intent detection working?
3. Verify system prompt says NOT to escalate for pricing

---

## Success Criteria

✅ **Product-Focused**: AI redirects ALL off-topic questions
✅ **Handoff Protocol**: AI follows exact 3-step protocol
✅ **Silence Mode**: AI stays completely silent after acknowledgment
✅ **No Auto-Escalation**: Pricing/demo questions don't trigger escalation
✅ **Natural Responses**: AI breaks responses into short chunks with 80ms delay

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| AI keeps answering after escalation | Early return removed but context not added | Check HANDOFF_ACTIVE context is added |
| AI doesn't redirect off-topic | System prompt not loaded | Restart backend, check SYSTEM_PROMPT variable |
| AI auto-escalates for pricing | Old escalation logic | Check escalation.py has pricing keywords removed |
| AI gives long responses | Streaming delay too fast | Verify 80ms delay in openai_service.py |
| AI answers off-topic after escalation | Silence mode not working | Check conversation history tracking |

---

## Database Verification

### Check Escalation Status
```python
# In MongoDB shell or Python
db.chats.find_one({"session_id": "YOUR_SESSION_ID"})
# Should show: "is_escalated": true
```

### Check Messages
```python
# In MongoDB shell or Python
db.messages.find({"chat_id": "YOUR_CHAT_ID"}).sort({"created_at": 1})
# Should show conversation history with AI acknowledgment
```

---

## Performance Metrics

- **Response Time**: < 2 seconds for first token
- **Typing Speed**: 80ms per chunk (natural human-like)
- **Redirect Accuracy**: 100% for off-topic questions
- **Handoff Success**: 100% silence after acknowledgment
- **Product Answer Rate**: 100% for product questions

---

## Notes

- Test in a clean chat session for each scenario
- Clear browser localStorage between tests if needed
- Check backend logs for any errors
- Verify database state after escalation
- Test with different phrasings of the same question
