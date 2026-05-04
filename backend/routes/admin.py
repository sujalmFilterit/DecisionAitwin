from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from db.helpers import doc
from models.user import new_user
from schemas.user import AgentCreate, UserOut
from services.auth import hash_password, get_user_by_email, require_roles
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])

admin_only = require_roles("admin")

@router.post("/create-agent", response_model=UserOut)
async def create_agent(data: AgentCreate, current_user: dict = Depends(admin_only)):
    """Admin-only: create an agent account. Role is hardcoded to 'agent'."""
    db = get_db()
    if await get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # role is HARDCODED to "agent" — admin cannot create another admin via API
    agent = new_user(data.email, data.name, hash_password(data.password), role="agent")
    agent_id = agent["_id"]
    await db.users.insert_one(agent)
    saved = await db.users.find_one({"_id": agent_id})
    return doc(saved)

@router.get("/agents", response_model=List[UserOut])
async def list_agents(current_user: dict = Depends(admin_only)):
    """Admin-only: list all agents."""
    db = get_db()
    agents = await db.users.find({"role": "agent"}).sort("created_at", -1).to_list(None)
    return [doc(a) for a in agents]

@router.get("/users", response_model=List[UserOut])
async def list_users(current_user: dict = Depends(admin_only)):
    """Admin-only: list all users."""
    db = get_db()
    users = await db.users.find({"role": "user"}).sort("created_at", -1).to_list(None)
    return [doc(u) for u in users]
