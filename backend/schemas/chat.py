from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from models.chat import ChatStatus
from schemas.message import MessageOut

class ChatOut(BaseModel):
    id: str
    session_id: str
    visitor_name: Optional[str]
    visitor_email: Optional[str]
    status: ChatStatus
    is_escalated: bool
    agent_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageOut] = []

class ChatSummary(BaseModel):
    id: str
    session_id: str
    visitor_name: Optional[str]
    visitor_email: Optional[str]
    status: ChatStatus
    is_escalated: bool
    agent_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
