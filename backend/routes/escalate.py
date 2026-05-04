from fastapi import APIRouter, HTTPException
from db.database import get_db
from db.helpers import doc
from models.chat import ChatStatus
from models.message import new_message, SenderType
from models.lead import new_lead
from services.websocket_manager import manager
from services.escalation import extract_contact_info, score_lead
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/escalate", tags=["escalate"])

class EscalateRequest(BaseModel):
    chat_id: str
    reason: str = "manual"

@router.post("")
async def escalate_chat(req: EscalateRequest):
    db = get_db()
    chat_obj = await db.chats.find_one({"_id": req.chat_id})
    if not chat_obj:
        raise HTTPException(status_code=404, detail="Chat not found")

    await db.chats.update_one(
        {"_id": req.chat_id},
        {"$set": {"is_escalated": True, "status": ChatStatus.escalated, "updated_at": datetime.now(timezone.utc)}}
    )

    all_msgs = await db.messages.find({"chat_id": req.chat_id}).to_list(None)
    contact = extract_contact_info(all_msgs)
    lead_score = score_lead(all_msgs)

    existing_lead = await db.leads.find_one({"chat_id": req.chat_id})
    if not existing_lead:
        lead = new_lead(
            req.chat_id,
            name=contact.get("name") or chat_obj.get("visitor_name"),
            email=contact.get("email") or chat_obj.get("visitor_email"),
            phone=contact.get("phone"),
            score=lead_score,
        )
        await db.leads.insert_one(lead)

    sys_msg = new_message(req.chat_id, SenderType.system, "Chat escalated to human agent.")
    await db.messages.insert_one(sys_msg)

    await manager.broadcast_to_all_agents({
        "event": "escalation_triggered",
        "chat_id": req.chat_id,
        "session_id": chat_obj["session_id"],
        "reason": req.reason,
        "visitor_name": chat_obj.get("visitor_name") or "Visitor",
    })
    await manager.send_to_customer(chat_obj["session_id"], {
        "event": "escalation_triggered",
        "message": "Connecting you to a human agent...",
        "sender_type": "system",
    })

    return {"success": True, "chat_id": req.chat_id}
