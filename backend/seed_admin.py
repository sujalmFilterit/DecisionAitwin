"""
Run once to seed the default admin user.
Usage:
    cd backend
    venv\\Scripts\\activate   (Windows) / source venv/bin/activate (Mac/Linux)
    python seed_admin.py
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import new_user
from services.auth import hash_password

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB  = os.getenv("MONGODB_DB",  "escalation_db")

ADMIN_EMAIL    = "admin@supportai.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME     = "Super Admin"

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB]

    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"✓ Admin already exists: {ADMIN_EMAIL}")
        client.close()
        return

    admin = new_user(ADMIN_EMAIL, ADMIN_NAME, hash_password(ADMIN_PASSWORD), role="admin")
    await db.users.insert_one(admin)
    print(f"✓ Admin seeded successfully!")
    print(f"  Email:    {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print(f"  Role:     admin")
    print(f"\n  ⚠  Change the password after first login!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
