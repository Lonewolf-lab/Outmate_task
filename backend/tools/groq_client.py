import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

class GroqClient:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = AsyncGroq(api_key=self.api_key)
        self.model="llama-3.1-8b-instant"

    async def complete(self, system_prompt: str, user_prompt: str) -> dict:
        raw_content = ""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt + "\n\nIMPORTANT: Respond only with valid JSON. No markdown, no backticks, no explanation outside the JSON object."},
                    {"role": "user", "content": user_prompt}
                ]
            )
            raw_content = response.choices[0].message.content
            if raw_content is None:
                raw_content = ""
            # Strip markdown code fences if model adds them anyway
            clean = raw_content.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
            return json.loads(clean.strip())
        except Exception as e:
            print(f"GROQ ERROR: {type(e).__name__}: {str(e)}")
            print(f"RAW CONTENT: '{raw_content}'")
            return {
                "error": str(e),
                "raw": raw_content
            }
