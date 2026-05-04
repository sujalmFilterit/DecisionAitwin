from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db.database import get_db
from services.auth import get_current_user
from models.project import new_project
from datetime import datetime, timezone

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str

class ProjectUpdate(BaseModel):
    name: str

@router.post("")
async def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """Create a new project for organizing chats"""
    db = get_db()
    
    project = new_project(
        user_id=current_user["_id"],
        name=data.name
    )
    
    await db.projects.insert_one(project)
    
    return {
        "id": project["_id"],
        "name": project["name"],
        "created_at": project["created_at"].isoformat(),
        "updated_at": project["updated_at"].isoformat()
    }

@router.get("")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects for the current user"""
    db = get_db()
    
    projects = await db.projects.find({"user_id": current_user["_id"]}).to_list(None)
    
    return [
        {
            "id": p["_id"],
            "name": p["name"],
            "created_at": p["created_at"].isoformat(),
            "updated_at": p["updated_at"].isoformat()
        }
        for p in projects
    ]

@router.patch("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    """Update project name"""
    db = get_db()
    
    # Verify ownership
    project = await db.projects.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project
    await db.projects.update_one(
        {"_id": project_id},
        {"$set": {"name": data.name, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Project updated"}

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a project and remove project_id from all associated chats"""
    db = get_db()
    
    # Verify ownership
    project = await db.projects.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Remove project_id from all chats in this project
    await db.chats.update_many(
        {"project_id": project_id},
        {"$set": {"project_id": None}}
    )
    
    # Delete the project
    await db.projects.delete_one({"_id": project_id})
    
    return {"message": "Project deleted"}

@router.patch("/{project_id}/chats/{chat_id}")
async def move_chat_to_project(project_id: str, chat_id: str, current_user: dict = Depends(get_current_user)):
    """Move a chat to a project (or pass 'none' as project_id to remove from project)"""
    db = get_db()
    
    # If project_id is 'none', remove from project
    if project_id == "none":
        await db.chats.update_one(
            {"_id": chat_id},
            {"$set": {"project_id": None, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"message": "Chat removed from project"}
    
    # Verify project ownership
    project = await db.projects.find_one({"_id": project_id, "user_id": current_user["_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update chat
    result = await db.chats.update_one(
        {"_id": chat_id},
        {"$set": {"project_id": project_id, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"message": "Chat moved to project"}
