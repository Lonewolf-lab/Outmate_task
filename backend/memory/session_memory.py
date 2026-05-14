import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta

class SessionMemory:
    def __init__(self):
        # Store dict: hash -> {"result": dict, "expires_at": datetime}
        self.store: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(minutes=30)

    def _hash_query(self, query: str) -> str:
        return hashlib.md5(query.encode('utf-8')).hexdigest()

    def get(self, query: str) -> Optional[dict]:
        query_hash = self._hash_query(query)
        if query_hash in self.store:
            entry = self.store[query_hash]
            if datetime.now(timezone.utc) <= entry["expires_at"]:
                return entry["result"]
            else:
                # Expired entry, remove it
                del self.store[query_hash]
        return None

    def set(self, query: str, result: dict):
        query_hash = self._hash_query(query)
        expires_at = datetime.now(timezone.utc) + self.ttl
        self.store[query_hash] = {
            "result": result,
            "expires_at": expires_at
        }

    def clear(self):
        self.store.clear()
