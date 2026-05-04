import enum
from datetime import datetime, timezone
import uuid

class SenderType(str, enum.Enum):
    user = "user"
    ai = "ai"
    agent = "agent"
    system = "system"

def new_message(chat_id: str, sender_type: SenderType, content: str, sender_name: str = None) -> dict:
    return {
        "_id": str(uuid.uuid4()),
        "chat_id": chat_id,
        "sender_type": sender_type,
        "sender_name": sender_name,
        "content": content,
        "created_at": datetime.now(timezone.utc),
    }
