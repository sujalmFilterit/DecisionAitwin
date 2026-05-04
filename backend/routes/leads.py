from fastapi import APIRouter, HTTPException, Depends
from db.database import get_db
from db.helpers import doc
from schemas.lead import LeadOut, LeadUpdate
from services.auth import require_roles
from typing import List
from datetime import datetime, timezone

router = APIRouter(prefix="/leads", tags=["leads"])

agent_or_admin = require_roles("agent", "admin")

@router.get("", response_model=List[LeadOut])
async def get_leads(current_user: dict = Depends(agent_or_admin)):
    db = get_db()
    leads = await db.leads.find().sort("created_at", -1).to_list(None)
    return [doc(l) for l in leads]

@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: str, current_user: dict = Depends(agent_or_admin)):
    db = get_db()
    lead = await db.leads.find_one({"_id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return doc(lead)

@router.patch("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: str,
    data: LeadUpdate,
    current_user: dict = Depends(agent_or_admin)
):
    db = get_db()
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc)
    await db.leads.update_one({"_id": lead_id}, {"$set": updates})
    lead = await db.leads.find_one({"_id": lead_id})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return doc(lead)
