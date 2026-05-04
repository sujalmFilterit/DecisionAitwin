from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from db.database import get_db
from services.websocket_manager import manager
from services.auth import get_current_user_from_token
import json

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/customer/{session_id}")
async def customer_ws(websocket: WebSocket, session_id: str):
    await manager.connect_customer(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("event") == "typing":
                db = get_db()
                chat_obj = await db.chats.find_one({"session_id": session_id})
                if chat_obj:
                    await manager.send_to_chat_agents(str(chat_obj["_id"]), {
                        "event": "customer_typing",
                        "session_id": session_id,
                    })
    except WebSocketDisconnect:
        manager.disconnect_customer(session_id)

@router.websocket("/ws/agent/{agent_id}")
async def agent_ws(websocket: WebSocket, agent_id: str, token: str = ""):
    agent = await get_current_user_from_token(token)
    if not agent:
        await websocket.close(code=4001)
        return

    await manager.connect_agent(agent_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("event") == "join_chat":
                chat_id = msg.get("chat_id")
                if chat_id:
                    await manager.agent_join_chat(chat_id, websocket)

            elif msg.get("event") == "leave_chat":
                chat_id = msg.get("chat_id")
                if chat_id:
                    manager.agent_leave_chat(chat_id, websocket)

            elif msg.get("event") == "typing":
                chat_id = msg.get("chat_id")
                if chat_id:
                    db = get_db()
                    chat_obj = await db.chats.find_one({"_id": chat_id})
                    if chat_obj:
                        await manager.send_to_customer(chat_obj["session_id"], {
                            "event": "agent_typing",
                            "agent_name": agent["name"],
                        })

    except WebSocketDisconnect:
        manager.disconnect_agent(agent_id)
