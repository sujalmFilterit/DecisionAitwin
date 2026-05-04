from datetime import datetime, timezone
import uuid

def new_project(user_id: str, name: str) -> dict:
    """Create a new project for organizing chats"""
    now = datetime.now(timezone.utc)
    return {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": name,
        "created_at": now,
        "updated_at": now,
    }
