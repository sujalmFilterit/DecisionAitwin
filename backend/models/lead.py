import enum
from datetime import datetime, timezone
import uuid

class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    converted = "converted"

class LeadScore(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

def new_lead(chat_id: str, name: str = None, email: str = None,
             phone: str = None, score: str = "medium") -> dict:
    now = datetime.now(timezone.utc)
    return {
        "_id": str(uuid.uuid4()),
        "chat_id": chat_id,
        "name": name,
        "email": email,
        "phone": phone,
        "status": LeadStatus.new,
        "score": score,
        "notes": None,
        "created_at": now,
        "updated_at": now,
    }
