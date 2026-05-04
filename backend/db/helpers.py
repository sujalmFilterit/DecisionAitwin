def doc(d: dict) -> dict:
    """Map MongoDB _id to id for Pydantic serialization."""
    if d is None:
        return None
    d = dict(d)
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d

def safe_id(d: dict) -> str:
    """Return the string _id from a mongo doc without mutating it."""
    return str(d["_id"])
