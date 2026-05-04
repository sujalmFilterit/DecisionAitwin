"""
Intent detection — pure keyword matching, no ML.
Runs before OpenAI so matched intents never hit the API.
"""
from typing import Optional
from dataclasses import dataclass


@dataclass
class IntentResult:
    intent: str
    response: str


# Intent definitions: (intent_name, keywords, response)
# NOTE: Removed pricing/demo/sales intents - let AI handle these to gather lead info
# NOTE: Removed most intents - let AI handle naturally for better conversation flow
_INTENTS = []

# Topics that are clearly off-topic for a SaaS support bot
# Reduced list - let AI handle redirects more naturally
_OFF_TOPIC_KEYWORDS = [
    # Only block very obvious off-topic queries
    # sports
    "ipl", "cricket match", "football match", "fifa", "world cup",
    # entertainment
    "bollywood", "hollywood", "netflix show",
    # coding help
    "write code", "debug code", "leetcode", "algorithm problem",
]


def detect_intent(message: str) -> Optional[IntentResult]:
    """
    1. Check if message is VERY off-topic → return polite redirect.
    2. Otherwise return None → let AI handle naturally.
    
    NOTE: Most queries (including pricing, demo, greetings, features) 
    now go to AI for natural conversation flow and lead capture.
    """
    lower = message.lower().strip()

    # ── Off-topic guard (only for very obvious cases) ─────────────────
    for kw in _OFF_TOPIC_KEYWORDS:
        if kw in lower:
            # Let AI handle the redirect naturally
            return None

    # ── Product intents ───────────────────────────────────────────────
    for intent_name, keywords, response in _INTENTS:
        for kw in keywords:
            if kw in lower:
                return IntentResult(intent=intent_name, response=response)

    # Let AI handle everything else naturally
    return None
