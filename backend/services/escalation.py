import re
from typing import Tuple, List

# Explicit escalation requests - user wants to talk to a human
ESCALATION_PHRASES = [
    "talk to human", "talk to agent", "talk to a human", "talk to a person",
    "human agent", "real person", "live agent", "live support", "speak to someone",
    "agent", "support", "representative", "operator", "sales person", "salesperson"
]

# Sales/Lead intent keywords - AI should handle these first, NOT escalate immediately
SALES_LEAD_KEYWORDS = [
    "price", "pricing", "cost", "how much", "demo", "buy", "purchase",
    "interested", "sign up", "subscribe", "trial", "plan", "quote", "subscription"
]

# Strong negative sentiment - escalate to human
NEGATIVE_SENTIMENT_PHRASES = [
    "frustrated", "angry", "upset", "not helpful", "bad service",
    "terrible", "awful", "horrible", "not working", "broken", 
    "useless", "waste", "disappointed", "worst", "hate", 
    "ridiculous", "unacceptable", "this is bad"
]

def detect_escalation(message: str) -> Tuple[bool, str]:
    """
    Trigger escalation ONLY when:
    1. User explicitly asks for human/agent/support
    2. User shows strong frustration or negative sentiment
    
    Do NOT escalate for sales/lead intent keywords (price, demo, etc.)
    """
    lower = message.lower()
    
    # Check for explicit human request
    for phrase in ESCALATION_PHRASES:
        if phrase in lower:
            return True, "user_requested"
    
    # Check for negative sentiment
    for phrase in NEGATIVE_SENTIMENT_PHRASES:
        if phrase in lower:
            return True, "negative_sentiment"
    
    # Sales/lead keywords should NOT trigger escalation
    # AI will handle these and gather lead info first
    return False, ""

def is_sales_intent(message: str) -> bool:
    """Check if message contains sales/lead intent keywords."""
    lower = message.lower()
    for keyword in SALES_LEAD_KEYWORDS:
        if re.search(rf"\b{re.escape(keyword)}\b", lower):
            return True
    return False

def score_lead(messages: List[dict]) -> str:
    """Score lead based on conversation content. Accepts list of message dicts."""
    full_text = " ".join([
        m["content"].lower() for m in messages if m.get("sender_type") == "user"
    ])
    high_score_keywords = ["buy", "purchase", "price", "demo", "interested", "sign up", "subscribe"]
    medium_score_keywords = ["how does", "what is", "tell me", "explain", "features"]
    high_count = sum(1 for kw in high_score_keywords if kw in full_text)
    medium_count = sum(1 for kw in medium_score_keywords if kw in full_text)
    if high_count >= 2:
        return "high"
    elif high_count == 1 or medium_count >= 2:
        return "medium"
    return "low"

def extract_contact_info(messages: List[dict]) -> dict:
    """Extract name, email, phone from message dicts."""
    full_text = " ".join([m.get("content", "") for m in messages])
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'\b(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\b'
    name_pattern = r'(?:my name is|i am|i\'m|call me)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)'
    emails = re.findall(email_pattern, full_text)
    phones = re.findall(phone_pattern, full_text)
    names = re.findall(name_pattern, full_text, re.IGNORECASE)
    return {
        "email": emails[0] if emails else None,
        "phone": phones[0][1] if phones else None,
        "name": names[0] if names else None,
    }
