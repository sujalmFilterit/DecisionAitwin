import enum
from datetime import datetime, timezone
import uuid

class ChatStatus(str, enum.Enum):
    active = "active"
    escalated = "escalated"
    assigned = "assigned"
    closed = "closed"

def new_chat(session_id: str, visitor_name: str = None, visitor_email: str = None, project_id: str = None) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "_id": str(uuid.uuid4()),
        "session_id": session_id,
        "visitor_name": visitor_name,
        "visitor_email": visitor_email,
        "status": ChatStatus.active,
        "is_escalated": False,
        "agent_id": None,
        "project_id": project_id,  # Link to project for organization
        "created_at": now,
        "updated_at": now,
    }
