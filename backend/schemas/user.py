from pydantic import BaseModel, EmailStr
from datetime import datetime

# Public registration — role is NEVER accepted from client
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

# Admin-only agent creation
class AgentCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    is_available: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
