from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.database import init_db, close_db
from routes import auth, chat, escalate, agent, leads, websocket, admin, analytics, projects
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title="AI Escalation System", version="1.0.0", lifespan=lifespan)

# origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(escalate.router)
app.include_router(agent.router)
app.include_router(leads.router)
app.include_router(websocket.router)
app.include_router(admin.router)
app.include_router(analytics.router)
app.include_router(projects.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
