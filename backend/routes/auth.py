from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from db.helpers import doc
from models.user import new_user
from schemas.user import UserCreate, UserLogin, UserOut, Token
from services.auth import (
    hash_password, authenticate_user, create_access_token,
    get_user_by_email, get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
async def register(data: UserCreate):
    """Public registration — always creates role=user. Role cannot be set by client."""
    db = get_db()
    if await get_user_by_email(data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # role is HARDCODED to "user" — never trust client input
    user = new_user(data.email, data.name, hash_password(data.password), role="user")
    user_id = user["_id"]
    await db.users.insert_one(user)
    saved = await db.users.find_one({"_id": user_id})
    return doc(saved)

@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    user = await authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user["email"], "role": user.get("role", "user")})
    return {"access_token": token, "token_type": "bearer", "user": doc(user)}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return doc(current_user)
