from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "escalation_db")

client: AsyncIOMotorClient = None

def get_client() -> AsyncIOMotorClient:
    return client

def get_db():
    return client[MONGODB_DB]

async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URL)

async def close_db():
    global client
    if client:
        client.close()

async def init_db():
    await connect_db()
    db = get_db()
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.chats.create_index("session_id", unique=True)
    await db.chats.create_index("status")
    await db.messages.create_index("chat_id")
    await db.leads.create_index("chat_id", unique=True)
