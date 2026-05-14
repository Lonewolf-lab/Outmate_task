from abc import ABC, abstractmethod
from datetime import datetime, timezone
from tools.groq_client import GroqClient
import json

class BaseAgent(ABC):
    def __init__(self, groq_client: GroqClient):
        self.groq_client = groq_client

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def run(self, context: dict) -> dict:
        pass

    def build_trace_entry(self, status: str, output: dict) -> dict:
        output_str = json.dumps(output)
        output_summary = output_str[:200]
        
        return {
            "agent": self.name,
            "status": status,
            "output_summary": output_summary,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
