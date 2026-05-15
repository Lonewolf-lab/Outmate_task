import os
import httpx
from dotenv import load_dotenv

load_dotenv()

class RetellClient:
    def __init__(self):
        self.api_key = os.getenv("RETELL_API_KEY")
        self.agent_id = os.getenv("RETELL_AGENT_ID")

    async def initiate_call(self, prospect_name: str, prospect_phone: str, context: str) -> dict:
        try:
            async with httpx.AsyncClient() as client:
                url = "https://api.retellai.com/v2/create-web-call"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "agent_id": self.agent_id,
                    "metadata": {
                        "prospect_name": prospect_name,
                        "context": context
                    }
                }

                response = await client.post(url, headers=headers, json=payload)

                if response.status_code == 401:
                    return {"call_status": "failed", "call_id": None, "message": "Invalid Retell API key"}
                if response.status_code == 429:
                    return {"call_status": "failed", "call_id": None, "message": "Rate limit hit, try again in 60 seconds"}

                response.raise_for_status()
                data = response.json()

                return {
                    "call_status": "initiated",
                    "call_id": data.get("call_id", "unknown"),
                    "access_token": data.get("access_token", ""),
                    "message": f"Web call initiated for {prospect_name}"
                }

        except Exception as e:
            return {"call_status": "failed", "call_id": None, "message": str(e)}