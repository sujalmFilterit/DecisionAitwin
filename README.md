# ConversaAI - AI-Powered Customer Engagement Platform

Modern customer support platform combining intelligent AI with seamless human escalation.

---

## Prerequisites

Install these before starting:

- **Python 3.11+** - [Download](https://python.org)
- **Node.js 18+** - [Download](https://nodejs.org)
- **MongoDB** - [Download Community Server](https://www.mongodb.com/try/download/community)

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` file (copy from `.env.example`):
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=conversaai_db
GROQ_API_KEY=your_api_key_here
SECRET_KEY=your_secret_key_here
```

Seed admin account:
```bash
python seed_admin.py
```

Start backend:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

---

## Default Access

After seeding, login credentials will be displayed in terminal.

**Note:** Change default credentials immediately in production.

---

## Architecture

```
Customer Chat Widget
    ↓
FastAPI Backend
    ↓
├─ AI Assistant (Groq)
├─ Escalation Engine
├─ Lead Capture
└─ MongoDB Storage
    ↓
Agent Dashboard
```

---

## Key Features

- 🤖 Context-aware AI conversations
- 🎯 Intelligent lead scoring
- ⚡ Real-time agent escalation
- 📊 Analytics dashboard
- 🔗 CRM integration ready
- 🔒 Secure authentication

---

## Environment Variables

Required variables in `backend/.env`:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=conversaai_db

# AI Service
GROQ_API_KEY=your_groq_api_key

# Security
SECRET_KEY=generate_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
CORS_ORIGINS=http://localhost:5173
```

**Security Notes:**
- Never commit `.env` files
- Use strong random strings for `SECRET_KEY`
- Rotate API keys regularly
- Use environment-specific configurations

---

## Production Deployment

### Security Checklist

- [ ] Change all default credentials
- [ ] Use strong SECRET_KEY (32+ characters)
- [ ] Enable HTTPS
- [ ] Set secure CORS_ORIGINS
- [ ] Use MongoDB Atlas with authentication
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security audits

### Environment Setup

1. Use MongoDB Atlas for production database
2. Set production environment variables
3. Configure proper CORS origins
4. Enable SSL/TLS
5. Set up backup strategy

---

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Troubleshooting

**MongoDB Connection Issues**
- Ensure MongoDB service is running
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

**AI Not Responding**
- Verify API key is valid
- Check API quota/credits
- Review backend logs

**WebSocket Issues**
- Confirm backend is on port 8000
- Check CORS configuration
- Verify frontend proxy settings

---

## Development

### Project Structure

```
├── backend/
│   ├── config/          # Product configuration
│   ├── db/              # Database connection
│   ├── models/          # Data models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── main.py          # Application entry
│
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   └── hooks/       # Custom hooks
    └── package.json
```

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

## License

Proprietary - All rights reserved

---

## Support

For issues and questions:
- Check documentation
- Review troubleshooting section
- Contact support team

---

**Note:** This README provides setup instructions only. Sensitive configuration details are managed through environment variables and should never be committed to version control.
