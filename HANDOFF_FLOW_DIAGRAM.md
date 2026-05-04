# AI Handoff Protocol - Flow Diagram

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     NORMAL CONVERSATION                          │
│                  (is_escalated = false)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                    ┌─────────▼─────────┐
                    │  User Message     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Intent Detection  │
                    └─────────┬──────────┘
                              │
                ┌─────────────┼─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  Product       │         │  Off-Topic     │
        │  Question      │         │  Question      │
        └───────┬────────┘         └───────┬────────┘
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  AI Answers    │         │  AI Redirects  │
        │  Naturally     │         │  to Product    │
        └────────────────┘         └────────────────┘
                │                           │
                │                           │
        "Great question!            "I'm here to help
         We have Starter            with our product 😊
         ($29/mo)..."               How can I assist?"


┌─────────────────────────────────────────────────────────────────┐
│                    HANDOFF REQUESTED                             │
│                  User: "talk to human"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Escalation       │
                    │  Detected         │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  AI Responds:     │
                    │  "Sure, I'm       │
                    │  connecting you   │
                    │  to a human..."   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Database Update  │
                    │  is_escalated =   │
                    │  true             │
                    └─────────┬─────────┘
                              │
                              ▼


┌─────────────────────────────────────────────────────────────────┐
│                  AFTER ESCALATION - FIRST MESSAGE                │
│              (is_escalated = true, no acknowledgment yet)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  User Message     │
                    │  "Hello?"         │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Backend adds     │
                    │  HANDOFF_ACTIVE   │
                    │  context to AI    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  AI checks        │
                    │  conversation     │
                    │  history          │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  No acknowledgment│
                    │  found in history │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  AI Responds ONCE:│
                    │  "I've already    │
                    │  connected you to │
                    │  a human agent."  │
                    └─────────┬─────────┘
                              │
                              ▼


┌─────────────────────────────────────────────────────────────────┐
│              AFTER ACKNOWLEDGMENT - SILENCE MODE                 │
│        (is_escalated = true, acknowledgment already sent)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  User Message     │
                    │  (any message)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Backend adds     │
                    │  HANDOFF_ACTIVE   │
                    │  context to AI    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  AI checks        │
                    │  conversation     │
                    │  history          │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Acknowledgment   │
                    │  found in history │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  AI: SILENCE      │
                    │  (no response)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Human Agent      │
                    │  Must Respond     │
                    └───────────────────┘
```

---

## State Transitions

```
┌──────────────┐
│   NORMAL     │  User asks product question
│   STATE      │─────────────────────────────────┐
│              │                                  │
│ is_escalated │                                  ▼
│   = false    │                          ┌──────────────┐
│              │                          │ AI Answers   │
└──────┬───────┘                          │ Naturally    │
       │                                  └──────────────┘
       │ User: "talk to human"
       │
       ▼
┌──────────────┐
│  ESCALATED   │  User sends message
│   STATE      │─────────────────────────────────┐
│              │                                  │
│ is_escalated │                                  ▼
│   = true     │                          ┌──────────────┐
│              │                          │ AI Checks    │
│ No ack sent  │                          │ History      │
└──────┬───────┘                          └──────┬───────┘
       │                                         │
       │                                         │
       │                                  ┌──────▼───────┐
       │                                  │ No ack found │
       │                                  └──────┬───────┘
       │                                         │
       │                                         ▼
       │                                  ┌──────────────┐
       │                                  │ AI Sends     │
       │                                  │ Acknowledgmt │
       │                                  └──────────────┘
       │
       ▼
┌──────────────┐
│  SILENCE     │  User sends ANY message
│   MODE       │─────────────────────────────────┐
│              │                                  │
│ is_escalated │                                  ▼
│   = true     │                          ┌──────────────┐
│              │                          │ AI Checks    │
│ Ack sent     │                          │ History      │
└──────────────┘                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │ Ack found    │
                                          └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │ AI: SILENCE  │
                                          │ (no response)│
                                          └──────────────┘
```

---

## Decision Tree

```
User sends message
        │
        ▼
Is chat escalated?
        │
    ┌───┴───┐
    │       │
   NO      YES
    │       │
    │       ▼
    │   Add HANDOFF_ACTIVE context
    │       │
    │       ▼
    │   AI checks conversation history
    │       │
    │   ┌───┴────────────────────┐
    │   │                        │
    │   │                        │
    │   ▼                        ▼
    │   Acknowledgment       No acknowledgment
    │   already sent         in history
    │   │                        │
    │   ▼                        ▼
    │   AI: SILENCE          AI: Send acknowledgment
    │   (no response)        "I've already connected..."
    │
    ▼
Is it product-related?
    │
┌───┴───┐
│       │
YES     NO
│       │
▼       ▼
AI      AI
Answers Redirects
```

---

## Message Flow Examples

### Example 1: Normal Product Question
```
User:  "What are your pricing plans?"
  ↓
AI:    "Great question!
       
       We have Starter ($29/mo), Pro ($99/mo), and Enterprise (custom) plans.
       
       Could you share your company size and email?
       
       I'll send you detailed pricing."
```

### Example 2: Off-Topic Question
```
User:  "What is artificial intelligence?"
  ↓
AI:    "I'm here to help with our product and services 😊
       
       How can I assist you with that?"
```

### Example 3: Handoff Request
```
User:  "I want to talk to a human"
  ↓
AI:    "Sure, I'm connecting you to a human agent right now.
       
       While you wait, you can continue typing your issue — the agent will see your messages."
  ↓
[Database: is_escalated = true]
```

### Example 4: First Message After Escalation
```
[is_escalated = true, no acknowledgment sent yet]

User:  "Hello? Anyone there?"
  ↓
[Backend adds: HANDOFF_ACTIVE = true]
  ↓
[AI checks history: no acknowledgment found]
  ↓
AI:    "I've already connected you to a human agent.
       
       They will assist you shortly."
```

### Example 5: Second Message After Escalation (Silence)
```
[is_escalated = true, acknowledgment already sent]

User:  "What is AI?"
  ↓
[Backend adds: HANDOFF_ACTIVE = true]
  ↓
[AI checks history: acknowledgment found]
  ↓
AI:    [SILENCE - no response]
  ↓
[Human agent must respond]
```

### Example 6: Multiple Messages After Escalation
```
[is_escalated = true, acknowledgment already sent]

User:  "Hello?"
  ↓
AI:    [SILENCE]

User:  "Is anyone there?"
  ↓
AI:    [SILENCE]

User:  "I need help with pricing"
  ↓
AI:    [SILENCE]

User:  "What is AI?"
  ↓
AI:    [SILENCE]

[Human agent must respond to all messages]
```

---

## Key Points

1. **Three States**: Normal → Escalated → Silence
2. **History Checking**: AI checks its own previous messages
3. **One Acknowledgment**: AI sends acknowledgment only once
4. **Complete Silence**: After acknowledgment, AI never responds
5. **No Exceptions**: Even product questions get silence after acknowledgment
6. **Human Takeover**: Human agent must respond in silence mode

---

## Backend Context Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend Processing                        │
└─────────────────────────────────────────────────────────────┘

1. User message arrives
        ↓
2. Load chat from database
        ↓
3. Check: is_escalated?
        ↓
    ┌───┴───┐
    NO      YES
    │       │
    │       ▼
    │   4. Build message history
    │       ↓
    │   5. Add system message:
    │      "HANDOFF_ACTIVE = true.
    │       The conversation has been
    │       escalated to a human agent.
    │       Follow the handoff protocol
    │       from your instructions."
    │       │
    ▼       ▼
6. Send to AI with system prompt
        ↓
7. AI processes with full context:
   - System prompt (handoff protocol)
   - Conversation history
   - HANDOFF_ACTIVE flag (if escalated)
        ↓
8. AI decides based on history:
   - No ack sent → send acknowledgment
   - Ack sent → stay silent
        ↓
9. Stream response to frontend
```

---

## Frontend Display

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface                            │
└─────────────────────────────────────────────────────────────┘

BEFORE ESCALATION:
┌──────────────────────────────────────────────────────────┐
│ 👤 User: What are your pricing plans?                   │
│                                                          │
│ 🤖 AI: Great question!                                  │
│        We have Starter ($29/mo), Pro ($99/mo)...        │
└──────────────────────────────────────────────────────────┘

HANDOFF REQUEST:
┌──────────────────────────────────────────────────────────┐
│ 👤 User: I want to talk to a human                      │
│                                                          │
│ 🤖 AI: Sure, I'm connecting you to a human agent...    │
│                                                          │
│ [Header changes: AI Assistant → Human Agent]            │
│ [Badge changes: Online → Connected]                     │
└──────────────────────────────────────────────────────────┘

AFTER ESCALATION (First Message):
┌──────────────────────────────────────────────────────────┐
│ 👤 User: Hello? Anyone there?                           │
│                                                          │
│ 🤖 AI: I've already connected you to a human agent.    │
│        They will assist you shortly.                    │
└──────────────────────────────────────────────────────────┘

SILENCE MODE:
┌──────────────────────────────────────────────────────────┐
│ 👤 User: What is AI?                                    │
│                                                          │
│ [No AI response - waiting for human agent]              │
│                                                          │
│ 👤 User: Is anyone there?                               │
│                                                          │
│ [No AI response - waiting for human agent]              │
│                                                          │
│ 👨‍💼 Agent: Hi! I'm here to help. What can I do for you? │
└──────────────────────────────────────────────────────────┘
```

---

## Summary

- **Normal State**: AI answers product questions, redirects off-topic
- **Escalated State**: AI sends acknowledgment once if user messages
- **Silence State**: AI stays completely silent, human must respond
- **History Tracking**: AI checks its own messages to know state
- **No Exceptions**: Silence mode applies to ALL messages (product or off-topic)
