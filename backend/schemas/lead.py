from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models.lead import LeadStatus, LeadScore

class LeadOut(BaseModel):
    id: str
    chat_id: str
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    status: LeadStatus
    score: LeadScore
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[LeadStatus] = None
    score: Optional[LeadScore] = None
    notes: Optional[str] = None
