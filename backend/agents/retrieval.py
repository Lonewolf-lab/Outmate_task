import json
from tools.groq_client import GroqClient
from agents.base_agent import BaseAgent

class RetrievalAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "RetrievalAgent"

    async def run(self, context: dict) -> dict:
        system_prompt = """You are a GTM Retrieval Agent. Given a structured plan, you generate realistic company records that match the filters.
You must handle ambiguous queries, missing fields, and over-constrained filters gracefully.
Respond only in valid JSON with this exact schema:
{
  "companies": [
    {
      "name": "string",
      "industry": "string",
      "region": "string",
      "stage": "string",
      "size": "string",
      "website": "string",
      "description": "string",
      "confidence": float between 0 and 1
    }
  ],
  "retrieval_notes": "string explaining any filter issues or assumptions made",
  "total_found": integer
}
Generate between 3 and 6 realistic companies. Do not hallucinate URLs — use plausible but clearly fictional domains."""

        plan = context.get("plan", {})
        user_prompt = f"Plan: {json.dumps(plan)}"

        try:
            output = await self.groq_client.complete(system_prompt, user_prompt)
            if "error" in output:
                status = "failed"
                result = {"error": True, "raw": output.get("raw", "")}
            else:
                status = "success"
                if "companies" not in output or not isinstance(output.get("companies"), list) or len(output["companies"]) == 0:
                    status = "partial"
                result = output
        except Exception as e:
            status = "failed"
            result = {"error": True, "message": str(e)}

        result["trace_entry"] = self.build_trace_entry(status, result)
        return result
