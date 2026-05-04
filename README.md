# AI-to-Human Escalation & Lead Handoff System

---

## What You Need to Install Manually

Before running anything, install these on your machine:

### 1. Python 3.11+
Download from https://python.org — make sure to check "Add to PATH" during install.

### 2. Node.js 18+
Download from https://nodejs.org

### 3. MongoDB Community Server
Download from https://www.mongodb.com/try/download/community
- Install and start the MongoDB service
- Default runs on `mongodb://localhost:27017` — no config needed for local dev
- Optionally install MongoDB Compass (GUI) to browse your data visually

### 4. OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new secret key
- You'll paste this into the backend `.env` file

---

## Default Credentials

### Admin
> Created by running the seed script (see Setup below)

| Field | Value |
|---|---|
| Email | `admin@supportai.com` |
| Password | `admin123` |
| Role | `admin` |
| Access | `/admin` dashboard + `/admin/manage` (create agents, view users) |

### Agent (example)
> Agents are created by the admin from `/admin/manage` → Create Agent tab

| Field | Value |
|---|---|
| Email | set by admin |
| Password | set by admin |
| Role | `agent` — auto-assigned, cannot be changed |
| Access | `/admin` dashboard, chats, leads |

### User (public)
> Anyone can self-register at `/login` → Create account

| Field | Value |
|---|---|
| Email | user's own email |
| Password | user's own password |
| Role | `user` — always hardcoded, client cannot change it |
| Access | `/chat` only |

> ⚠ There is no public way to become an agent or admin. Agents are created by admin only. Admin is seeded via script only.

---

## How the System Works

```
Visitor (browser)
    │
    ▼
Chat Widget (React)
    │  POST /chat
    ▼
FastAPI Backend
    │
    ├─► Intent Detection (minimal - only blocks very off-topic queries)
    │       └─► Most queries pass through to AI
    │
    ├─► OpenAI/Groq AI  ◄── AI handles conversations naturally
    │       • Responds to greetings warmly
    │       • Answers product questions (pricing, features, demos)
    │       • Gathers lead information (name, email, phone)
    │       • Guides users toward conversion
    │       • Politely redirects off-topic questions
    │
    ├─► Escalation Engine
    │       detects: "talk to agent", "support", "frustrated", "angry"
    │       if triggered ──► marks chat as escalated in MongoDB
    │                    ──► creates a Lead document automatically
    │                    ──► broadcasts via WebSocket to all agents
    │
    └─► MongoDB  (stores users, chats, messages, leads)

Agent (browser)
    │
    ▼
Admin Dashboard (/admin)
    │  WebSocket /ws/agent/{id}
    ├─► receives real-time escalation alerts
    ├─► clicks into chat, clicks "Join Chat"
    ├─► types replies → POST /agent/message
    │       └─► saved to MongoDB
    │       └─► pushed via WebSocket to customer's chat widget
    └─► views/updates leads at /admin/leads
```

### Collections in MongoDB

| Collection | What it stores |
|---|---|
| `users` | Agent accounts (email, hashed password, availability) |
| `chats` | Each chat session (visitor info, status, assigned agent) |
| `messages` | Every message in every chat (user / ai / agent / system) |
| `leads` | Auto-captured lead info (name, email, phone, score, status) |

### Chat Statuses

| Status | Meaning |
|---|---|
| `active` | AI is handling the chat |
| `escalated` | Escalation triggered, waiting for an agent to join |
| `assigned` | An agent has joined and is responding |
| `closed` | Chat ended |

### Escalation Triggers (automatic)

The system escalates automatically when the visitor:
- **Explicitly requests human help**: "talk to human", "agent", "live support", "real person", "representative", "sales person"
- **Shows strong negative sentiment**: "frustrated", "angry", "not helpful", "bad service", "terrible", "not working"

**Important**: The system does NOT escalate immediately for sales/lead intent keywords like:
- "price", "pricing", "demo", "buy", "interested", "subscribe"

Instead, the AI will:
1. Respond warmly and naturally (even to casual greetings like "hi", "how are you")
2. Answer product questions helpfully
3. Ask follow-up questions (name, email, company, use case)
4. Gather lead information automatically
5. Guide users toward conversion (demo, pricing, signup)
6. Offer human handoff only when explicitly requested or if user is frustrated

Example conversations:
```
User: "hi there"
AI: "Hey! 👋 I'm doing great, thanks for asking! How can I help you today?"

User: "what is pricing"
AI: "Our pricing depends on your team size and features needed. We have Starter ($29/mo), 
     Professional ($99/mo), and Enterprise (custom) plans. Could you share your company 
     size or specific requirements so I can recommend the best fit? Also, may I have 
     your email to send detailed pricing?"

User: "this is not working"
AI: "I'm sorry to hear that! Let me connect you with a human expert who can help 
     resolve this right away."
```

### Lead Scoring (automatic)

| Score | Condition |
|---|---|
| High | 2+ high-intent keywords in conversation |
| Medium | 1 high-intent or 2+ informational keywords |
| Low | General browsing |

---

## Setup & Run

### Step 1 — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Now open `backend/.env` and fill in your values:

```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=escalation_db
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx   ← paste your OpenAI key here
SECRET_KEY=any-long-random-string-here       ← make this up, keep it secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

You should see: `Application startup complete.`
API docs available at: http://localhost:8000/docs

---

### Step 2 — Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Using the System

### As a Visitor
1. Open http://localhost:5173
2. Click the 💬 button in the bottom-right corner
3. Optionally enter your name and click Start
4. Chat with the AI
5. Say "I want to talk to an agent" or "what's the price?" to trigger escalation

### As an Agent
1. Ask your admin to create an agent account for you from `/admin/manage`
2. Go to http://localhost:5173/login and sign in with the credentials your admin gave you
3. You land on the dashboard at `/admin`
4. When a visitor escalates, you'll see a red notification and the chat appears as "escalated"
5. Click "View →" on any chat
6. Click "Join Chat" to take over from the AI
7. Type replies in the input box — they appear in the visitor's chat widget in real time
8. Go to `/admin/leads` to see all captured leads and update their status

### As an Admin
1. First run the seed script (see Setup below) to create the admin account
2. Go to http://localhost:5173/login and sign in with `admin@supportai.com` / `admin123`
3. You land on `/admin` — the chat dashboard
4. Go to `/admin/manage` (⚙️ Manage in the sidebar) to:
   - Create agent accounts
   - View all agents
   - View all registered users

---

## What You DON'T Need to Do Manually

- Create MongoDB collections or indexes — done automatically on startup
- Run migrations — there are none, MongoDB is schemaless

## What You DO Need to Do Once

Seed the admin account before first use:

```bash
cd backend
venv\Scripts\activate    # Windows
# source venv/bin/activate  # Mac/Linux
python seed_admin.py
```

Output:
```
✓ Admin seeded successfully!
  Email:    admin@supportai.com
  Password: admin123
  Role:     admin
```

Then log in at http://localhost:5173/login with those credentials.

---

## Troubleshooting

**500 error on login/register**
- Make sure MongoDB is running: open MongoDB Compass or run `mongod` in terminal
- Check your `MONGODB_URL` in `.env`

**AI not responding**
- Check your `OPENAI_API_KEY` in `.env` — must start with `sk-`
- Make sure you have credits on your OpenAI account

**WebSocket not connecting**
- Backend must be running on port 8000
- Frontend must be running on port 5173
- Check `CORS_ORIGINS=http://localhost:5173` in `.env`

**"Email already registered" on register**
- That email exists — use a different one or log in instead

---

## MongoDB Atlas (Cloud) — Optional

If you want to use MongoDB Atlas instead of local:

1. Create free cluster at https://cloud.mongodb.com
2. Get your connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net`)
3. Set in `.env`:
```env
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net
MONGODB_DB=escalation_db
```
