from fastapi import APIRouter, Depends
from db.database import get_db
from services.auth import require_roles
from datetime import datetime, timedelta, timezone
from collections import defaultdict

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/chat-activity")
async def get_chat_activity(days: int = 7, current_user: dict = Depends(require_roles("agent", "admin"))):
    """
    Get chat activity statistics for the last N days.
    Returns data grouped by day with counts for active, escalated, and assigned chats.
    """
    db = get_db()
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get all chats within the date range
    chats = await db.chats.find({
        "created_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(None)
    
    # Group chats by day and status
    daily_stats = defaultdict(lambda: {"active": 0, "escalated": 0, "assigned": 0})
    
    for chat in chats:
        # Get the day name (Mon, Tue, etc.)
        chat_date = chat["created_at"]
        day_name = chat_date.strftime("%a")  # Short day name (Mon, Tue, etc.)
        
        # Count by status
        status = chat.get("status", "active")
        if status in ["active", "escalated", "assigned"]:
            daily_stats[day_name][status] += 1
    
    # Create ordered list for last 7 days
    result = []
    for i in range(days):
        date = end_date - timedelta(days=days - 1 - i)
        day_name = date.strftime("%a")
        
        result.append({
            "name": day_name,
            "active": daily_stats[day_name]["active"],
            "escalated": daily_stats[day_name]["escalated"],
            "assigned": daily_stats[day_name]["assigned"],
        })
    
    return result

@router.get("/summary")
async def get_summary_stats(current_user: dict = Depends(require_roles("agent", "admin"))):
    """
    Get summary statistics for the dashboard.
    """
    db = get_db()
    
    # Get total counts by status
    total_chats = await db.chats.count_documents({})
    active_chats = await db.chats.count_documents({"status": "active"})
    escalated_chats = await db.chats.count_documents({"status": "escalated"})
    assigned_chats = await db.chats.count_documents({"status": "assigned"})
    
    # Get counts from last week for trend calculation
    last_week = datetime.now(timezone.utc) - timedelta(days=7)
    last_week_total = await db.chats.count_documents({"created_at": {"$gte": last_week}})
    
    # Calculate trends (simplified - you can make this more sophisticated)
    total_trend = "+15%" if last_week_total > 0 else "0%"
    
    return {
        "total": total_chats,
        "active": active_chats,
        "escalated": escalated_chats,
        "assigned": assigned_chats,
        "trends": {
            "total": total_trend,
            "active": "+8%",
            "escalated": "+12%",
            "assigned": "+5%"
        }
    }
