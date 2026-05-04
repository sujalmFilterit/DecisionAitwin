from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # chat_id -> list of websockets (agents watching this chat)
        self.agent_connections: Dict[str, List[WebSocket]] = {}
        # session_id -> websocket (customer)
        self.customer_connections: Dict[str, WebSocket] = {}
        # agent_id -> websocket
        self.agent_ws: Dict[str, WebSocket] = {}

    async def connect_customer(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.customer_connections[session_id] = websocket

    def disconnect_customer(self, session_id: str):
        self.customer_connections.pop(session_id, None)

    async def connect_agent(self, agent_id: str, websocket: WebSocket):
        await websocket.accept()
        self.agent_ws[agent_id] = websocket

    def disconnect_agent(self, agent_id: str):
        self.agent_ws.pop(agent_id, None)

    async def agent_join_chat(self, chat_id: str, websocket: WebSocket):
        if chat_id not in self.agent_connections:
            self.agent_connections[chat_id] = []
        if websocket not in self.agent_connections[chat_id]:
            self.agent_connections[chat_id].append(websocket)

    def agent_leave_chat(self, chat_id: str, websocket: WebSocket):
        if chat_id in self.agent_connections:
            self.agent_connections[chat_id] = [
                ws for ws in self.agent_connections[chat_id] if ws != websocket
            ]

    async def send_to_customer(self, session_id: str, data: dict):
        ws = self.customer_connections.get(session_id)
        if ws:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                self.disconnect_customer(session_id)

    async def send_to_chat_agents(self, chat_id: str, data: dict):
        connections = self.agent_connections.get(chat_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.agent_leave_chat(chat_id, ws)

    async def broadcast_to_all_agents(self, data: dict):
        dead = []
        for agent_id, ws in self.agent_ws.items():
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(agent_id)
        for agent_id in dead:
            self.disconnect_agent(agent_id)

manager = ConnectionManager()
