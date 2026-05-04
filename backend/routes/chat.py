from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from db.database import get_db
from db.helpers import doc
from models.chat import new_chat, ChatStatus
from models.message import new_message, SenderType
from models.lead import new_lead
from schemas.message import ChatRequest
from schemas.chat import ChatOut, ChatSummary
from services.openai_service import get_ai_response, stream_ai_response
from services.escalation import detect_escalation, extract_contact_info, score_lead
from services.intent import detect_intent
from services.websocket_manager import manager
from services.auth import require_roles, get_current_user
from datetime import datetime, timezone
from typing import List
import json

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("")
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()

    chat_obj = await db.chats.find_one({"session_id": req.session_id})
    if not chat_obj:
        chat_doc = new_chat(req.session_id, req.visitor_name, req.visitor_email)
        chat_id = chat_doc["_id"]  # snapshot before insert mutates
        await db.chats.insert_one(chat_doc)
        chat_obj = await db.chats.find_one({"_id": chat_id})

    chat_id = str(chat_obj["_id"])

    # Save user message
    user_msg = new_message(chat_id, SenderType.user, req.message, req.visitor_name or "Visitor")
    await db.messages.insert_one(user_msg)

    await manager.send_to_chat_agents(chat_id, {
        "event": "user_message",
        "chat_id": chat_id,
        "session_id": req.session_id,
        "message": req.message,
        "sender": req.visitor_name or "Visitor",
    })

    should_escalate, reason = detect_escalation(req.message)

    if should_escalate and not chat_obj.get("is_escalated"):
        await db.chats.update_one(
            {"_id": chat_obj["_id"]},
            {"$set": {"is_escalated": True, "status": ChatStatus.escalated, "updated_at": datetime.now(timezone.utc)}}
        )

        all_msgs = await db.messages.find({"chat_id": chat_id}).to_list(None)
        contact = extract_contact_info(all_msgs)
        lead_score = score_lead(all_msgs)

        existing_lead = await db.leads.find_one({"chat_id": chat_id})
        if not existing_lead:
            lead = new_lead(
                chat_id,
                name=contact.get("name") or req.visitor_name,
                email=contact.get("email") or req.visitor_email,
                phone=contact.get("phone"),
                score=lead_score,
            )
            await db.leads.insert_one(lead)

        sys_msg = new_message(chat_id, SenderType.system, "Chat escalated to human agent. Please wait...")
        await db.messages.insert_one(sys_msg)

        await manager.broadcast_to_all_agents({
            "event": "escalation_triggered",
            "chat_id": chat_id,
            "session_id": req.session_id,
            "reason": reason,
            "visitor_name": req.visitor_name or "Visitor",
        })
        await manager.send_to_customer(req.session_id, {
            "event": "escalation_triggered",
            "message": "Connecting you to a human agent. Please hold on...",
            "sender_type": "system",
        })
        return {
            "response": "I'm connecting you with a human agent right now. Please hold on for a moment.",
            "escalated": True,
            "reason": reason,
        }

    # If already escalated, let AI respond with acknowledgment (following handoff protocol)
    # The AI system prompt will handle the response appropriately

    # ── Intent detection (runs before OpenAI — no API call needed) ────
    intent_result = detect_intent(req.message)
    if intent_result:
        intent_msg = new_message(chat_id, SenderType.ai, intent_result.response, "AI Assistant")
        await db.messages.insert_one(intent_msg)
        await db.chats.update_one({"_id": chat_obj["_id"]}, {"$set": {"updated_at": datetime.now(timezone.utc)}})
        await manager.send_to_chat_agents(chat_id, {
            "event": "ai_response",
            "chat_id": chat_id,
            "message": intent_result.response,
            "sender": "AI Assistant",
        })
        return {
            "response": intent_result.response,
            "escalated": False,
            "intent": intent_result.intent,
        }

    # ── Fallback: OpenAI ──────────────────────────────────────────────
    history = await db.messages.find(
        {"chat_id": chat_id, "sender_type": {"$in": [SenderType.user, SenderType.ai]}}
    ).sort("created_at", 1).to_list(None)

    openai_messages = [
        {"role": "user" if m["sender_type"] == SenderType.user else "assistant", "content": m["content"]}
        for m in history
    ]

    # Add escalation state to context if chat was previously escalated
    # This tells AI to follow the handoff protocol (respond once with acknowledgment, then silence)
    if chat_obj.get("is_escalated"):
        openai_messages.append({
            "role": "system",
            "content": "HANDOFF_ACTIVE = true. The conversation has been escalated to a human agent. Follow the handoff protocol from your instructions."
        })

    ai_text = await get_ai_response(openai_messages)

    ai_msg = new_message(chat_id, SenderType.ai, ai_text, "AI Assistant")
    await db.messages.insert_one(ai_msg)
    await db.chats.update_one({"_id": chat_obj["_id"]}, {"$set": {"updated_at": datetime.now(timezone.utc)}})

    await manager.send_to_chat_agents(chat_id, {
        "event": "ai_response",
        "chat_id": chat_id,
        "message": ai_text,
        "sender": "AI Assistant",
    })

    return {"response": ai_text, "escalated": chat_obj.get("is_escalated", False)}

@router.get("/stream")
async def chat_stream(
    session_id: str,
    message: str,
    visitor_name: str = "",
    visitor_email: str = "",
    current_user: dict = Depends(get_current_user),
):
    """
    SSE streaming endpoint.
    Sends: thinking → token chunks → done event.
    """
    db = get_db()

    # get or create chat
    chat_obj = await db.chats.find_one({"session_id": session_id})
    if not chat_obj:
        chat_doc = new_chat(session_id, visitor_name or None, visitor_email or None)
        chat_id = chat_doc["_id"]
        await db.chats.insert_one(chat_doc)
        chat_obj = await db.chats.find_one({"_id": chat_id})
    chat_id = str(chat_obj["_id"])

    # save user message
    user_msg = new_message(chat_id, SenderType.user, message, visitor_name or "Visitor")
    await db.messages.insert_one(user_msg)

    await manager.send_to_chat_agents(chat_id, {
        "event": "user_message", "chat_id": chat_id,
        "session_id": session_id, "message": message,
        "sender": visitor_name or "Visitor",
    })

    async def event_stream():
        # ── escalation check ──────────────────────────────────────────
        should_escalate, reason = detect_escalation(message)
        if should_escalate and not chat_obj.get("is_escalated"):
            await db.chats.update_one(
                {"_id": chat_obj["_id"]},
                {"$set": {"is_escalated": True, "status": ChatStatus.escalated,
                           "updated_at": datetime.now(timezone.utc)}}
            )
            all_msgs = await db.messages.find({"chat_id": chat_id}).to_list(None)
            contact = extract_contact_info(all_msgs)
            lead_score = score_lead(all_msgs)
            existing_lead = await db.leads.find_one({"chat_id": chat_id})
            if not existing_lead:
                lead = new_lead(chat_id,
                    name=contact.get("name") or visitor_name,
                    email=contact.get("email") or visitor_email,
                    phone=contact.get("phone"), score=lead_score)
                await db.leads.insert_one(lead)
            sys_msg = new_message(chat_id, SenderType.system, "Chat escalated to human agent. Please wait...")
            await db.messages.insert_one(sys_msg)
            await manager.broadcast_to_all_agents({
                "event": "escalation_triggered", "chat_id": chat_id,
                "session_id": session_id, "reason": reason,
                "visitor_name": visitor_name or "Visitor",
            })
            text = "I'm connecting you with a human agent right now. Please hold on for a moment."
            yield f"data: {json.dumps({'type':'meta','escalated':True})}\n\n"
            for ch in text:
                yield f"data: {json.dumps({'type':'token','token':ch})}\n\n"
            yield f"data: {json.dumps({'type':'done','full':text,'escalated':True})}\n\n"
            return

        # If already escalated, let AI respond with acknowledgment (following handoff protocol)
        # The AI system prompt will handle the response appropriately

        # ── intent detection ──────────────────────────────────────────
        intent_result = detect_intent(message)
        if intent_result:
            text = intent_result.response
            intent_msg = new_message(chat_id, SenderType.ai, text, "AI Assistant")
            await db.messages.insert_one(intent_msg)
            await db.chats.update_one({"_id": chat_obj["_id"]},
                {"$set": {"updated_at": datetime.now(timezone.utc)}})
            yield f"data: {json.dumps({'type':'meta','escalated':False,'intent':intent_result.intent})}\n\n"
            for ch in text:
                yield f"data: {json.dumps({'type':'token','token':ch})}\n\n"
            yield f"data: {json.dumps({'type':'done','full':text,'escalated':False})}\n\n"
            return

        # ── Groq streaming ────────────────────────────────────────────
        history = await db.messages.find(
            {"chat_id": chat_id, "sender_type": {"$in": [SenderType.user, SenderType.ai]}}
        ).sort("created_at", 1).to_list(None)
        openai_messages = [
            {"role": "user" if m["sender_type"] == SenderType.user else "assistant",
             "content": m["content"]}
            for m in history
        ]
        
        # Add escalation state to context if chat was previously escalated
        # This tells AI to follow the handoff protocol (respond once with acknowledgment, then silence)
        if chat_obj.get("is_escalated"):
            openai_messages.append({
                "role": "system",
                "content": "HANDOFF_ACTIVE = true. The conversation has been escalated to a human agent. Follow the handoff protocol from your instructions."
            })

        yield f"data: {json.dumps({'type':'meta','escalated':chat_obj.get('is_escalated', False)})}\n\n"

        full_text = ""
        async for chunk in stream_ai_response(openai_messages):
            full_text += chunk
            yield f"data: {json.dumps({'type':'token','token':chunk})}\n\n"

        # save full response
        ai_msg = new_message(chat_id, SenderType.ai, full_text, "AI Assistant")
        await db.messages.insert_one(ai_msg)
        await db.chats.update_one({"_id": chat_obj["_id"]},
            {"$set": {"updated_at": datetime.now(timezone.utc)}})
        await manager.send_to_chat_agents(chat_id, {
            "event": "ai_response", "chat_id": chat_id,
            "message": full_text, "sender": "AI Assistant",
        })
        yield f"data: {json.dumps({'type':'done','full':full_text,'escalated':False})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("", response_model=List[ChatSummary])
async def get_chats(current_user: dict = Depends(require_roles("agent", "admin"))):
    db = get_db()
    chats = await db.chats.find().sort("updated_at", -1).to_list(None)
    result = []
    for c in chats:
        count = await db.messages.count_documents({"chat_id": str(c["_id"])})
        d = doc(c)
        d["message_count"] = count
        result.append(d)
    return result

@router.get("/{chat_id}", response_model=ChatOut)
async def get_chat(chat_id: str, current_user: dict = Depends(require_roles("agent", "admin"))):
    db = get_db()
    chat_obj = await db.chats.find_one({"_id": chat_id})
    if not chat_obj:
        raise HTTPException(status_code=404, detail="Chat not found")
    msgs = await db.messages.find({"chat_id": chat_id}).sort("created_at", 1).to_list(None)
    d = doc(chat_obj)
    d["messages"] = [doc(m) for m in msgs]
    return d
