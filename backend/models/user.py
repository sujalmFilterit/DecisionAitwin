from datetime import datetime, timezone
import uuid

def new_user(email: str, name: str, hashed_password: str, role: str = "user") -> dict:
    return {
        "_id": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "hashed_password": hashed_password,
        "role": role,          # "user" | "agent" | "admin"
        "is_active": True,
        "is_available": True,
        "created_at": datetime.now(timezone.utc),
    }
