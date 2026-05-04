from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models.message import SenderType

class MessageOut(BaseModel):
    id: str
    chat_id: str
    sender_type: SenderType
    sender_name: Optional[str]
    content: str
    created_at: datetime

class ChatRequest(BaseModel):
    session_id: str
    message: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None

class AgentMessageRequest(BaseModel):
    chat_id: str
    message: str
