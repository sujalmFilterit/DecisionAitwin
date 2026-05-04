from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from models.chat import ChatStatus
from models.message import new_message, SenderType
from schemas.message import AgentMessageRequest
from services.websocket_manager import manager
from services.auth import require_roles
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/agent", tags=["agent"])

class JoinChatRequest(BaseModel):
    chat_id: str

class AvailabilityRequest(BaseModel):
    is_available: bool

# All agent routes require role = agent or admin
agent_or_admin = require_roles("agent", "admin")

@router.post("/message")
async def agent_message(
    req: AgentMessageRequest,
    current_user: dict = Depends(agent_or_admin)
):
    db = get_db()
    chat_obj = await db.chats.find_one({"_id": req.chat_id})
    if not chat_obj:
        raise HTTPException(status_code=404, detail="Chat not found")

    msg = new_message(req.chat_id, SenderType.agent, req.message, current_user["name"])
    msg_id = msg["_id"]
    await db.messages.insert_one(msg)
    await db.chats.update_one(
        {"_id": req.chat_id},
        {"$set": {"updated_at": datetime.now(timezone.utc)}}
    )

    payload = {
        "event": "agent_message",
        "chat_id": req.chat_id,
        "message": req.message,
        "sender": current_user["name"],
        "sender_type": "agent",
        "message_id": msg_id,
    }
    await manager.send_to_customer(chat_obj["session_id"], payload)
    await manager.send_to_chat_agents(req.chat_id, payload)
    return {"success": True, "message_id": msg_id}

@router.post("/join")
async def join_chat(
    req: JoinChatRequest,
    current_user: dict = Depends(agent_or_admin)
):
    db = get_db()
    chat_obj = await db.chats.find_one({"_id": req.chat_id})
    if not chat_obj:
        raise HTTPException(status_code=404, detail="Chat not found")

    await db.chats.update_one(
        {"_id": req.chat_id},
        {"$set": {
            "agent_id": str(current_user["_id"]),
            "status": ChatStatus.assigned,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    sys_msg = new_message(req.chat_id, SenderType.system, f"Agent {current_user['name']} has joined the chat.")
    await db.messages.insert_one(sys_msg)

    await manager.send_to_customer(chat_obj["session_id"], {
        "event": "agent_joined",
        "agent_name": current_user["name"],
        "message": f"Agent {current_user['name']} has joined the chat.",
        "sender_type": "system",
    })
    await manager.broadcast_to_all_agents({
        "event": "agent_joined",
        "chat_id": req.chat_id,
        "agent_name": current_user["name"],
    })
    return {"success": True}

@router.post("/availability")
async def set_availability(
    req: AvailabilityRequest,
    current_user: dict = Depends(agent_or_admin)
):
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"is_available": req.is_available}}
    )
    return {"success": True, "is_available": req.is_available}
